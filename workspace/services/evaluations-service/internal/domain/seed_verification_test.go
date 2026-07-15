package domain

import (
	"database/sql"
	"os"
	"testing"
)

// TestSeedDataCounts verifies that seed SQL produces the expected record counts.
// This is an integration test that requires a real PostgreSQL connection.
// Run with: DB_URL=postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable&search_path=evaluations_service go test -run TestSeedDataCounts
func TestSeedDataCounts(t *testing.T) {
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		t.Skip("Skipping integration test: DB_URL not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Fatalf("failed to ping: %v", err)
	}

	tests := []struct {
		name          string
		query         string
		schema        string
		expectedCount int
	}{
		{
			name:          "152 indicators",
			query:         "SELECT COUNT(*) FROM %s.indicator",
			schema:        "evaluations_service",
			expectedCount: 152,
		},
		{
			name:          "77 requirements",
			query:         "SELECT COUNT(*) FROM %s.requirement",
			schema:        "evaluations_service",
			expectedCount: 77,
		},
		{
			name:          "16 scopes",
			query:         "SELECT COUNT(*) FROM %s.scope",
			schema:        "evaluations_service",
			expectedCount: 16,
		},
		{
			name:          "5 axis levels",
			query:         "SELECT COUNT(*) FROM %s.axis_level",
			schema:        "evaluations_service",
			expectedCount: 5,
		},
		{
			name:          "2 member types",
			query:         "SELECT COUNT(*) FROM %s.member_type",
			schema:        "evaluations_service",
			expectedCount: 2,
		},
		{
			name:          "2 destination typologies",
			query:         "SELECT COUNT(*) FROM %s.destination_typology",
			schema:        "evaluations_service",
			expectedCount: 2,
		},
		{
			name:          "5 population ranges",
			query:         "SELECT COUNT(*) FROM %s.population_range",
			schema:        "evaluations_service",
			expectedCount: 5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			query := tt.query
			if tt.schema != "" {
				query = "SET search_path TO " + tt.schema + "; " + query
			}

			var count int
			fullQuery := query
			if tt.schema != "" {
				fullQuery = "SELECT COUNT(*) FROM " + tt.schema + "." + extractTableName(tt.query)
			} else {
				fullQuery = tt.query
			}

			err := db.QueryRow(fullQuery).Scan(&count)
			if err != nil {
				t.Fatalf("query failed: %v", err)
			}
			if count != tt.expectedCount {
				t.Errorf("expected %d, got %d", tt.expectedCount, count)
			}
		})
	}
}

func TestSeedData_IndicatorCodes(t *testing.T) {
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		t.Skip("Skipping integration test: DB_URL not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Fatalf("failed to ping: %v", err)
	}

	// Verify all indicators have valid JSON criteria
	var nullCriteriaCount int
	err = db.QueryRow("SELECT COUNT(*) FROM evaluations_service.indicator WHERE criteria IS NULL OR criteria = '[]'").Scan(&nullCriteriaCount)
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if nullCriteriaCount > 0 {
		t.Errorf("expected 0 indicators with empty/null criteria, got %d", nullCriteriaCount)
	}
}

// helper to extract table name from "SELECT COUNT(*) FROM schema.table"
func extractTableName(query string) string {
	// simple: extract after "FROM "
	prefix := "FROM "
	idx := indexOf(query, prefix)
	if idx == -1 {
		return query
	}
	rest := query[idx+len(prefix):]
	// if there's a dot, take after the dot
	dotIdx := indexOf(rest, ".")
	if dotIdx != -1 {
		return rest[dotIdx+1:]
	}
	return rest
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
