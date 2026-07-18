package infrastructure_test

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/lib/pq"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestOrganizationMigrationIsRetrySafe(t *testing.T) {
	if testing.Short() {
		t.Skip("requires PostgreSQL")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	container, err := postgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:16-alpine"),
		postgres.WithDatabase("foundation"),
		postgres.WithUsername("foundation"),
		postgres.WithPassword("foundation"),
		testcontainers.WithWaitStrategyAndDeadline(3*time.Minute,
			wait.ForLog("database system is ready to accept connections").WithOccurrence(2)),
	)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = container.Terminate(context.Background()) })
	host, err := container.Host(ctx)
	if err != nil {
		t.Fatal(err)
	}
	port, err := container.MappedPort(ctx, "5432/tcp")
	if err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("postgres", fmt.Sprintf("postgres://foundation:foundation@%s:%s/foundation?sslmode=disable", host, port.Port()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	if _, err = db.ExecContext(ctx, `CREATE TABLE organizations (id UUID); CREATE TABLE memberships (id UUID, organization_id UUID, principal_id UUID);`); err != nil {
		t.Fatal(err)
	}
	_, file, _, _ := runtime.Caller(0)
	migration, err := os.ReadFile(filepath.Join(filepath.Dir(file), "..", "..", "..", "..", "backend", "migrations", "1782200000_create_organizations_memberships.up.sql"))
	if err != nil {
		t.Fatal(err)
	}
	for attempt := 1; attempt <= 2; attempt++ {
		if _, err = db.ExecContext(ctx, string(migration)); err != nil {
			t.Fatalf("migration attempt %d: %v", attempt, err)
		}
	}
	assertCount(t, db, `SELECT count(*) FROM pg_constraint WHERE conname = ANY($1)`, []string{"organizations_pkey", "memberships_pkey", "memberships_organization_fk", "memberships_org_principal_key"}, 4)
	assertCount(t, db, `SELECT count(*) FROM pg_indexes WHERE indexname = ANY($1)`, []string{"memberships_organization_idx", "memberships_principal_idx"}, 2)
	assertCount(t, db, `SELECT count(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name IN ('organizations','memberships') AND column_name = 'created_at'`, nil, 2)

	org := "20000000-0000-0000-0000-000000000001"
	if _, err = db.Exec(`INSERT INTO organizations (id) VALUES ($1)`, org); err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec(`INSERT INTO memberships (id, organization_id, principal_id) VALUES ($1,$2,$3)`, "30000000-0000-0000-0000-000000000001", org, "10000000-0000-0000-0000-000000000001"); err != nil {
		t.Fatal(err)
	}
	assertRejected(t, db, `INSERT INTO memberships (id, organization_id, principal_id) VALUES ($1,$2,$3)`, "30000000-0000-0000-0000-000000000002", org, "10000000-0000-0000-0000-000000000001")
	assertRejected(t, db, `INSERT INTO memberships (id, organization_id, principal_id) VALUES ($1,$2,$3)`, "30000000-0000-0000-0000-000000000003", "20000000-0000-0000-0000-000000000099", "10000000-0000-0000-0000-000000000002")
	assertRejected(t, db, `INSERT INTO memberships (id, principal_id) VALUES ($1,$2)`, "30000000-0000-0000-0000-000000000004", "10000000-0000-0000-0000-000000000003")
	assertRejected(t, db, `INSERT INTO memberships (id, organization_id) VALUES ($1,$2)`, "30000000-0000-0000-0000-000000000005", org)
}

func assertCount(t *testing.T, db *sql.DB, query string, values []string, want int) {
	t.Helper()
	var got int
	var err error
	if values == nil {
		err = db.QueryRow(query).Scan(&got)
	} else {
		err = db.QueryRow(query, pq.Array(values)).Scan(&got)
	}
	if err != nil || got != want {
		t.Fatalf("count = %d, want %d, error = %v", got, want, err)
	}
}

func assertRejected(t *testing.T, db *sql.DB, query string, args ...any) {
	t.Helper()
	if _, err := db.Exec(query, args...); err == nil {
		t.Fatal("constraint accepted invalid membership")
	}
}
