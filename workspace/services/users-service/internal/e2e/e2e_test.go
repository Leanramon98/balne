//go:build e2e

package e2e

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	"golang.org/x/crypto/bcrypt"

	httpadapter "users-service/internal/adapters/in/http"
	postgres "users-service/internal/adapters/out/postgres"
	"users-service/internal/domain"
	"users-service/internal/usecases"


)

// ============================================================
//  Test email spy — real implementation, captures for assert
// ============================================================

type emailEntry struct {
	To      string
	Subject string
	Body    string
}

type emailSpy struct {
	mu     sync.Mutex
	emails []emailEntry
}

func (s *emailSpy) SendEmail(to, subject, body string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.emails = append(s.emails, emailEntry{To: to, Subject: subject, Body: body})
	return nil
}

func (s *emailSpy) last() *emailEntry {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.emails) == 0 {
		return nil
	}
	return &s.emails[len(s.emails)-1]
}

func (s *emailSpy) count() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.emails)
}

func (s *emailSpy) reset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.emails = nil
}

// ============================================================
//  Test suite — shared across all tests
// ============================================================

type e2eSuite struct {
	db       *sql.DB
	server   *httptest.Server
	emailSvc *emailSpy
	baseURL  string
}

// Global shared suite (start once via TestMain, reused by all tests)
var globalSuite *e2eSuite

func TestMain(m *testing.M) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// 1. Start Postgres container
	pg, err := tcpostgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:16-alpine"),
		tcpostgres.WithDatabase("testdb"),
		tcpostgres.WithUsername("test"),
		tcpostgres.WithPassword("test"),
		testcontainers.WithWaitStrategyAndDeadline(3*time.Minute,
			wait.ForLog("database system is ready to accept connections").
				WithStartupTimeout(2*time.Minute).
				WithPollInterval(500*time.Millisecond),
		),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to start postgres container: %v\n", err)
		os.Exit(1)
	}

	host, err := pg.Host(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to get host: %v\n", err)
		os.Exit(1)
	}
	port, err := pg.MappedPort(ctx, "5432/tcp")
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to get mapped port: %v\n", err)
		os.Exit(1)
	}
	connStr := fmt.Sprintf("postgres://test:test@%s:%s/testdb?sslmode=disable", host, port.Port())
	fmt.Printf("connection string: %s\n", connStr)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to open database: %v\n", err)
		os.Exit(1)
	}

	// Retry ping
	var pingErr error
	for i := 0; i < 10; i++ {
		pingErr = db.PingContext(ctx)
		if pingErr == nil {
			break
		}
		fmt.Printf("ping attempt %d failed: %v\n", i+1, pingErr)
		time.Sleep(1 * time.Second)
	}
	if pingErr != nil {
		fmt.Fprintf(os.Stderr, "failed to ping database: %v\n", pingErr)
		os.Exit(1)
	}

	// 2. Run migrations
	if err := runSQLFiles(db); err != nil {
		fmt.Fprintf(os.Stderr, "failed to run migrations: %v\n", err)
		os.Exit(1)
	}

	// 3. Build dependencies
	emailSvc := &emailSpy{}
	userRepo := postgres.NewUserRepo(db)
	roleRepo := postgres.NewRoleRepo(db)
	prRepo := postgres.NewPasswordResetRepo(db)

	logic := usecases.NewLogic(
		usecases.WithUserRepository(userRepo),
		usecases.WithRoleRepository(roleRepo),
		usecases.WithPasswordResetRepository(prRepo),
		usecases.WithEmailService(emailSvc),
	)

	// 4. Build Echo server
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.GET("/health", func(c echo.Context) error {
		if err := db.Ping(); err != nil {
			return c.JSON(503, map[string]string{"status": "unhealthy"})
		}
		return c.JSON(200, map[string]string{"status": "ok"})
	})

	api := e.Group("/api")
	if os.Getenv("SKIP_AUTH") != "true" {
		api.Use(httpadapter.AuthMiddleware)
	}
	httpadapter.NewHandler(api, logic, db)
	httpadapter.RegisterAuthRecoveryRoutes(api, logic)

	server := httptest.NewServer(e)

	globalSuite = &e2eSuite{
		db:       db,
		server:   server,
		emailSvc: emailSvc,
		baseURL:  server.URL,
	}

	code := m.Run()

	server.Close()
	db.Close()
	pg.Terminate(ctx)
	os.Exit(code)
}

// runSQLFiles bootstraps the database schema from init_generated.sql
// (which has correct UUID/TIMESTAMP types but wrong table order),
// then runs extra migration files that add columns or seed data.
func runSQLFiles(db *sql.DB) error {
	ctx := context.Background()

	// The schema comes from init_generated.sql — it has the correct types
	// (UUID, TIMESTAMP, BOOL via TEXT) that match the repository scan functions.
	// The file has dependency ordering issues (user→role, userprofile→user, etc.)
	// and uses dollar-quoting in the function body.
	//
	// Solution: we define the core tables in correct order here (modeled on init),
	// then run the extra migration files.

	createRole := `CREATE TABLE IF NOT EXISTS role (
	  id UUID PRIMARY KEY NOT NULL
	  , name VARCHAR(255) NOT NULL UNIQUE
	  , description VARCHAR(255) NOT NULL
	  , permissions TEXT NOT NULL
	);`

	createUser := `CREATE TABLE IF NOT EXISTS "user" (
	  id UUID PRIMARY KEY NOT NULL
	  , email VARCHAR(255) NOT NULL
	  , passwordhash VARCHAR(255) NOT NULL
	  , fullname VARCHAR(255) NOT NULL
	  , roleid UUID NOT NULL REFERENCES role(id)
	  , isactive TEXT NOT NULL
	  , destinationid UUID
	  , createdat TIMESTAMP NOT NULL
	  , updatedat TIMESTAMP NOT NULL
	);`

	createUserProfile := `CREATE TABLE IF NOT EXISTS userprofile (
	  id UUID PRIMARY KEY NOT NULL
	  , userid UUID NOT NULL REFERENCES "user"(id)
	  , avatarurl VARCHAR(255) NOT NULL
	  , bio TEXT NOT NULL
	  , preferences TEXT NOT NULL
	);`

	createLoginResponse := `CREATE TABLE IF NOT EXISTS loginresponse (
	  token VARCHAR(255) NOT NULL
	  , "user" UUID NOT NULL REFERENCES "user"(id)
	  , role VARCHAR(255) NOT NULL
	  , destinationid UUID NOT NULL
	  , permissions TEXT NOT NULL
	);`

	createOtherTables := []string{
		`CREATE TABLE IF NOT EXISTS loginrequest (
		  email VARCHAR(255) NOT NULL
		  , password VARCHAR(255) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS registerrequest (
		  email VARCHAR(255) NOT NULL
		  , password VARCHAR(255) NOT NULL
		  , fullname VARCHAR(255) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS healthresponse (
		  status VARCHAR(255) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS rootresponse (
		  message VARCHAR(255) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS user_history (
		  history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		  entity_id UUID NOT NULL,
		  operation TEXT NOT NULL,
		  old_data JSONB,
		  new_data JSONB,
		  changed_by TEXT,
		  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS auditlog (
		  id UUID PRIMARY KEY NOT NULL
		  , entitytype VARCHAR(255) NOT NULL
		  , entityid UUID NOT NULL
		  , action VARCHAR(255) NOT NULL
		  , oldvalue TEXT NOT NULL
		  , newvalue TEXT NOT NULL
		  , changedby UUID NOT NULL
		  , changedat TIMESTAMP NOT NULL
		  , ipaddress VARCHAR(255) NOT NULL
		);`,
	}

	tables := append([]string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
		createRole,
		createUser,
		createUserProfile,
		createLoginResponse,
	}, createOtherTables...)

	for _, ddl := range tables {
		if _, err := db.ExecContext(ctx, ddl); err != nil {
			return fmt.Errorf("failed to create table: %w\nSQL: %s", err, ddl)
		}
	}

	// Step 2: Run extra migration files (add_dti_fields seeds roles, password_reset_tokens)
	root, err := findProjectRoot()
	if err != nil {
		return fmt.Errorf("failed to find project root: %w", err)
	}
	matches, err := filepath.Glob(filepath.Join(root, "migrations", "*.up.sql"))
	if err != nil {
		return fmt.Errorf("failed to glob migrations: %w", err)
	}
	sort.Strings(matches)

	for _, m := range matches {
		base := filepath.Base(m)
		if strings.Contains(base, "add_dti_fields") || strings.Contains(base, "password_reset_tokens") {
			content, err := os.ReadFile(m)
			if err != nil {
				return fmt.Errorf("failed to read %s: %w", m, err)
			}
			if _, err := db.ExecContext(ctx, string(content)); err != nil {
				return fmt.Errorf("failed to execute %s: %w", base, err)
			}
		}
	}
	return nil
}

func findProjectRoot() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	dir := cwd
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("go.mod not found from %s", cwd)
}

// ============================================================
//  Test helpers
// ============================================================

// apiURL builds a full URL for the given path.
func (s *e2eSuite) apiURL(path string) string {
	return s.baseURL + "/api" + path
}

// rawURL builds a full URL without the /api prefix.
func (s *e2eSuite) rawURL(path string) string {
	return s.baseURL + path
}

// authToken generates a JWT for testing authenticated endpoints.
func (s *e2eSuite) authToken(userID, role string) string {
	claims := &httpadapter.ExtendedClaims{
		UserID: userID,
		Role:   role,
		Permissions: httpadapter.PermissionClaims{
			AccessScope:             "global",
			CanWriteValues:          true,
			CanManageUsers:          true,
			CanApproveGoodPractices: true,
		},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString(httpadapter.JWTSecret)
	return signed
}

// seedUser creates a user directly in the database and returns it.
// The password is hashed with bcrypt using the given plaintext.
func (s *e2eSuite) seedUser(t *testing.T, email, password, fullName string, roleID uuid.UUID, isActive bool, destID *uuid.UUID) *domain.User {
	t.Helper()

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	user := &domain.User{
		ID:            uuid.New(),
		Email:         email,
		PasswordHash:  string(hash),
		FullName:      fullName,
		RoleID:        roleID,
		DestinationID: destID,
		IsActive:      isActive,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	_, err = s.db.ExecContext(context.Background(),
		`INSERT INTO "user" (id, email, passwordhash, fullname, roleid, destinationid, isactive, createdat, updatedat)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		user.ID, user.Email, user.PasswordHash, user.FullName,
		user.RoleID, user.DestinationID, user.IsActive, user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	return user
}

// ensureAdminRole ensures at least one admin role exists and returns its ID.
func (s *e2eSuite) ensureAdminRole(t *testing.T) uuid.UUID {
	t.Helper()

	var id string
	err := s.db.QueryRow(`SELECT id FROM role WHERE name = 'admin'`).Scan(&id)
	if err == nil {
		uid, _ := uuid.Parse(id)
		return uid
	}

	// Create it if not seeded yet
	roleID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	_, err = s.db.Exec(
		`INSERT INTO role (id, name, description, permissions) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
		roleID, "admin", "Super admin", `{"access_scope":"global","can_write_values":true,"can_manage_users":true,"can_approve_good_practices":true}`,
	)
	if err != nil {
		t.Fatalf("failed to create admin role: %v", err)
	}
	return roleID
}

// getRoleID returns the UUID for a role name.
func (s *e2eSuite) getRoleID(t *testing.T, name string) uuid.UUID {
	t.Helper()
	var id string
	err := s.db.QueryRow(`SELECT id FROM role WHERE name = $1`, name).Scan(&id)
	if err != nil {
		t.Fatalf("role %q not found: %v", name, err)
	}
	uid, _ := uuid.Parse(id)
	return uid
}

// httpDo performs an HTTP request and returns the response.
func (s *e2eSuite) httpDo(t *testing.T, method, url string, body any, token string) *http.Response {
	t.Helper()

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to marshal body: %v", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed to do request: %v", err)
	}
	return resp
}

// readBody reads the full response body and returns it as a string.
func readBody(t *testing.T, resp *http.Response) string {
	t.Helper()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}
	resp.Body.Close()
	return string(b)
}

// loginResp is the expected shape of the login response.
type loginResp struct {
	Token         string           `json:"token"`
	User          string           `json:"user"`
	Role          string           `json:"role"`
	DestinationID *string          `json:"destination_id,omitempty"`
	Permissions   permissionClaims `json:"permissions"`
}

type permissionClaims struct {
	AccessScope             string   `json:"access_scope"`
	CanWriteValues          bool     `json:"can_write_values"`
	CanManageUsers          bool     `json:"can_manage_users"`
	CanApproveGoodPractices bool     `json:"can_approve_good_practices"`
	EvaluationTypes         []string `json:"evaluation_types"`
}

// suiteForTest returns the global suite, resetting state for each test.
func suiteForTest(t *testing.T) *e2eSuite {
	t.Helper()
	globalSuite.emailSvc.reset()
	return globalSuite
}

// ============================================================
//  HISTORY 1: Login — autenticación de usuarios
// ============================================================

func TestE2E_Login_Success(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	suite.seedUser(t, "success@test.com", "correct-password", "Test User", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "success@test.com", "password": "correct-password"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var lr loginResp
	if err := json.Unmarshal([]byte(readBody(t, resp)), &lr); err != nil {
		t.Fatalf("failed to parse login response: %v", err)
	}
	if lr.Token == "" {
		t.Fatal("expected non-empty token")
	}
	if lr.Role != "admin" {
		t.Errorf("Role: got %q, want 'admin'", lr.Role)
	}
}

func TestE2E_Login_WrongPassword(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	suite.seedUser(t, "wrongpass@test.com", "secret", "Test User", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "wrongpass@test.com", "password": "wrong"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", resp.StatusCode)
	}
}

func TestE2E_Login_InactiveUser(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	suite.seedUser(t, "inactive@test.com", "secret", "Inactive User", roleID, false, nil)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "inactive@test.com", "password": "secret"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", resp.StatusCode)
	}
}

func TestE2E_Login_UnknownEmail(t *testing.T) {
	suite := suiteForTest(t)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "unknown@test.com", "password": "any"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", resp.StatusCode)
	}
}

func TestE2E_Login_ReturnsPermissions(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.getRoleID(t, "gestor_destino")
	suite.seedUser(t, "gestor@test.com", "pass123", "Gestor Destino", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "gestor@test.com", "password": "pass123"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var lr loginResp
	if err := json.Unmarshal([]byte(readBody(t, resp)), &lr); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if lr.Role != "gestor_destino" {
		t.Errorf("Role: got %q, want 'gestor_destino'", lr.Role)
	}
	if lr.Permissions.AccessScope != "destination" {
		t.Errorf("AccessScope: got %q, want 'destination'", lr.Permissions.AccessScope)
	}
	if !lr.Permissions.CanManageUsers {
		t.Error("expected CanManageUsers to be true for gestor_destino")
	}
	if lr.Permissions.CanApproveGoodPractices {
		t.Error("expected CanApproveGoodPractices to be false for gestor_destino")
	}
}

func TestE2E_Login_AdminReturnsGlobalScope(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.getRoleID(t, "admin")
	suite.seedUser(t, "admin@test.com", "admin123", "Admin User", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "admin@test.com", "password": "admin123"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var lr loginResp
	if err := json.Unmarshal([]byte(readBody(t, resp)), &lr); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if lr.Permissions.AccessScope != "global" {
		t.Errorf("AccessScope: got %q, want 'global'", lr.Permissions.AccessScope)
	}
}

// ============================================================
//  HISTORY 2: Auth Guard — endpoints protegidos
// ============================================================

func TestE2E_AuthGuard_NoToken(t *testing.T) {
	suite := suiteForTest(t)

	tests := []struct {
		name string
		url  string
	}{
		{"list users", suite.apiURL("/users")},
		{"create user", suite.apiURL("/users")},
		{"get roles", suite.apiURL("/roles")},
		{"get profile", suite.apiURL("/profile")},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			method := http.MethodGet
			if tt.name == "create user" {
				method = http.MethodPost
			}
			resp := suite.httpDo(t, method, tt.url, nil, "")
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusUnauthorized {
				t.Errorf("expected 401, got %d for %s", resp.StatusCode, tt.url)
			}
		})
	}
}

func TestE2E_AuthGuard_ValidToken(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	user := suite.seedUser(t, "authed@test.com", "pass", "Authed User", roleID, true, nil)

	token := suite.authToken(user.ID.String(), "admin")

	resp := suite.httpDo(t, http.MethodGet, suite.apiURL("/users"), nil, token)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}
}

func TestE2E_AuthGuard_PublicEndpoints(t *testing.T) {
	suite := suiteForTest(t)

	tests := []struct {
		name string
		url  string
	}{
		{"health", suite.rawURL("/health")},
		{"forgot-password", suite.apiURL("/auth/forgot-password")},
		{"reset-password", suite.apiURL("/auth/reset-password")},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			method := http.MethodPost
			if tt.name == "health" {
				method = http.MethodGet
			}
			var body any
			if tt.name == "forgot-password" {
				body = map[string]string{"email": "nobody@test.com"}
			}
			resp := suite.httpDo(t, method, tt.url, body, "")
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusUnauthorized {
				t.Errorf("%s returned 401 but should be public", tt.name)
			}
		})
	}
}

// ============================================================
//  HISTORY 3: Admin CRUD de usuarios
// ============================================================

func TestE2E_CreateUser_HappyPath(t *testing.T) {
	suite := suiteForTest(t)

	adminID := uuid.New().String()
	token := suite.authToken(adminID, "admin")

	roleID := suite.getRoleID(t, "admin")

	body := map[string]any{
		"email":     "newuser@test.com",
		"full_name": "New User",
		"password":  "Welcome123",
		"role_id":   roleID.String(),
		"is_active": true,
	}

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/users"), body, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// Verify user exists in DB
	var count int
	err := suite.db.QueryRow(`SELECT COUNT(*) FROM "user" WHERE email = $1`, "newuser@test.com").Scan(&count)
	if err != nil {
		t.Fatalf("failed to query user: %v", err)
	}
	if count != 1 {
		t.Errorf("expected 1 user in DB, got %d", count)
	}
}

func TestE2E_CreateUser_SendsWelcomeEmail(t *testing.T) {
	suite := suiteForTest(t)

	adminID := uuid.New().String()
	token := suite.authToken(adminID, "admin")
	roleID := suite.getRoleID(t, "admin")

	suite.emailSvc.reset()
	body := map[string]any{
		"email":     "welcome@test.com",
		"full_name": "Welcome User",
		"password":  "Test123!",
		"role_id":   roleID.String(),
		"is_active": true,
	}

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/users"), body, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	email := suite.emailSvc.last()
	if email == nil {
		t.Fatal("expected welcome email to be sent")
	}
	if email.To != "welcome@test.com" {
		t.Errorf("email To: got %q, want 'welcome@test.com'", email.To)
	}
	if !strings.Contains(email.Body, "Test123!") {
		t.Error("expected email body to contain the password")
	}
}

func TestE2E_ListUsers(t *testing.T) {
	suite := suiteForTest(t)

	token := suite.authToken(uuid.New().String(), "admin")
	roleID := suite.ensureAdminRole(t)

	// Seed 3 users
	suite.seedUser(t, "u1@test.com", "pass", "User One", roleID, true, nil)
	suite.seedUser(t, "u2@test.com", "pass", "User Two", roleID, true, nil)
	suite.seedUser(t, "u3@test.com", "pass", "User Three", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodGet, suite.apiURL("/users"), nil, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var result struct {
		Items []any `json:"items"`
		Total int   `json:"total"`
	}
	if err := json.Unmarshal([]byte(readBody(t, resp)), &result); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if result.Total < 3 {
		t.Errorf("expected at least 3 users, got %d", result.Total)
	}
}

func TestE2E_UpdateUser(t *testing.T) {
	suite := suiteForTest(t)

	token := suite.authToken(uuid.New().String(), "admin")
	roleID := suite.ensureAdminRole(t)
	user := suite.seedUser(t, "update@test.com", "pass", "Original Name", roleID, true, nil)

	body := map[string]any{
		"full_name": "Updated Name",
		"email":     "update@test.com",
		"role_id":   roleID.String(),
		"is_active": true,
	}

	resp := suite.httpDo(t, http.MethodPut, suite.apiURL("/users/"+user.ID.String()), body, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// Verify in DB
	var fullName string
	err := suite.db.QueryRow(`SELECT fullname FROM "user" WHERE id = $1`, user.ID).Scan(&fullName)
	if err != nil {
		t.Fatalf("failed to query user: %v", err)
	}
	if fullName != "Updated Name" {
		t.Errorf("fullname: got %q, want 'Updated Name'", fullName)
	}
}

func TestE2E_DeleteUser(t *testing.T) {
	suite := suiteForTest(t)

	token := suite.authToken(uuid.New().String(), "admin")
	roleID := suite.ensureAdminRole(t)
	user := suite.seedUser(t, "delete@test.com", "pass", "Delete Me", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodDelete, suite.apiURL("/users/"+user.ID.String()), nil, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// Verify deleted
	var count int
	err := suite.db.QueryRow(`SELECT COUNT(*) FROM "user" WHERE id = $1`, user.ID).Scan(&count)
	if err != nil {
		t.Fatalf("failed to query: %v", err)
	}
	if count != 0 {
		t.Errorf("expected user to be deleted, count=%d", count)
	}
}

func TestE2E_ToggleUserActive(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)

	// Create active user
	user := suite.seedUser(t, "toggle@test.com", "pass", "Toggle User", roleID, true, nil)

	// Deactivate via PUT (PATCH is not registered, so we use PUT)
	token := suite.authToken(uuid.New().String(), "admin")
	resp := suite.httpDo(t, http.MethodPut, suite.apiURL("/users/"+user.ID.String()),
		map[string]any{"email": user.Email, "full_name": user.FullName, "role_id": user.RoleID.String(), "is_active": false}, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on PUT, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// Verify inactive in DB
	var isActive bool
	err := suite.db.QueryRow(`SELECT isactive FROM "user" WHERE id = $1`, user.ID).Scan(&isActive)
	if err != nil {
		t.Fatalf("failed to query: %v", err)
	}
	if isActive {
		t.Error("expected isactive to be false after toggle")
	}

	// Verify can't login
	loginResp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "toggle@test.com", "password": "pass"}, "")
	defer loginResp.Body.Close()
	if loginResp.StatusCode == http.StatusOK {
		t.Error("expected inactive user to be rejected on login")
	}
}

// ============================================================
//  HISTORY 4: Password Recovery — forgot + reset flow
// ============================================================

func TestE2E_ForgotPassword_RegisteredUser(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	suite.seedUser(t, "forgot@test.com", "oldpass", "Forgot User", roleID, true, nil)

	suite.emailSvc.reset()
	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/forgot-password"),
		map[string]string{"email": "forgot@test.com"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// Verify email was sent
	email := suite.emailSvc.last()
	if email == nil {
		t.Fatal("expected email to be sent after forgot-password")
	}
	if email.To != "forgot@test.com" {
		t.Errorf("email To: got %q, want 'forgot@test.com'", email.To)
	}
	if !strings.Contains(email.Body, "reset-password?token=") {
		t.Error("expected email body to contain reset link")
	}
}

func TestE2E_ForgotPassword_UnknownUser(t *testing.T) {
	suite := suiteForTest(t)

	suite.emailSvc.reset()
	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/forgot-password"),
		map[string]string{"email": "nobody@test.com"}, "")
	defer resp.Body.Close()

	// Must return 200 for unknown users (no user enumeration)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	// Must NOT send any email
	if suite.emailSvc.count() > 0 {
		t.Error("expected no email to be sent for unknown user (no user enumeration)")
	}
}

func TestE2E_ResetPassword_FullFlow(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	suite.seedUser(t, "resetflow@test.com", "original-pass", "Reset Flow", roleID, true, nil)

	// 1. Request password reset
	suite.emailSvc.reset()
	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/forgot-password"),
		map[string]string{"email": "resetflow@test.com"}, "")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("forgot-password: expected 200, got %d", resp.StatusCode)
	}

	// 2. Extract token from email body
	email := suite.emailSvc.last()
	if email == nil {
		t.Fatal("no email sent")
	}

	var rawToken string
	for _, line := range strings.Split(email.Body, "\n") {
		if strings.Contains(line, "reset-password?token=") {
			parts := strings.Split(line, "token=")
			if len(parts) > 1 {
				rawToken = strings.TrimSpace(parts[1])
			}
			break
		}
	}
	if rawToken == "" {
		t.Fatalf("could not extract reset token from email body:\n%s", email.Body)
	}

	// 3. Reset password with the extracted token
	resp = suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/reset-password"),
		map[string]string{"token": rawToken, "new_password": "new-secure-pass"}, "")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("reset-password: expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// 4. Login with NEW password
	resp = suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "resetflow@test.com", "password": "new-secure-pass"}, "")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login after reset: expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// 5. Login with OLD password must fail
	resp = suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "resetflow@test.com", "password": "original-pass"}, "")
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK {
		t.Error("expected old password to fail after reset")
	}

	// 6. Reuse the same token must fail (already used)
	resp = suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/reset-password"),
		map[string]string{"token": rawToken, "new_password": "another-pass"}, "")
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK {
		t.Error("expected reused token to be rejected")
	}
}

func TestE2E_ResetPassword_InvalidToken(t *testing.T) {
	suite := suiteForTest(t)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/reset-password"),
		map[string]string{"token": "definitely-invalid-token", "new_password": "newpass123"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

// ============================================================
//  HISTORY 5: Roles — listado de roles
// ============================================================

func TestE2E_ListRoles(t *testing.T) {
	suite := suiteForTest(t)

	token := suite.authToken(uuid.New().String(), "admin")

	resp := suite.httpDo(t, http.MethodGet, suite.apiURL("/roles"), nil, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var result struct {
		Items []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"items"`
		Total int `json:"total"`
	}
	if err := json.Unmarshal([]byte(readBody(t, resp)), &result); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}

	if result.Total < 7 {
		t.Errorf("expected at least 7 DTI roles, got %d", result.Total)
	}

	// Verify specific roles exist from the seed migration
	roleNames := make(map[string]bool)
	for _, r := range result.Items {
		roleNames[r.Name] = true
	}
	expected := []string{"admin", "admin_destino", "gestor_destino", "consultor", "auditor", "gestor_regional", "gestor_nacional"}
	for _, name := range expected {
		if !roleNames[name] {
			t.Errorf("expected role %q not found in list", name)
		}
	}
}

// ============================================================
//  HISTORY 6: Profile — ver perfil propio
// ============================================================

func TestE2E_GetProfile(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	user := suite.seedUser(t, "profile@test.com", "pass", "Profile User", roleID, true, nil)

	token := suite.authToken(user.ID.String(), "admin")

	resp := suite.httpDo(t, http.MethodGet, suite.apiURL("/profile"), nil, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var body map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	item, ok := body["Item"].(map[string]any)
	if !ok {
		t.Fatal("expected Item in response")
	}
	if item["email"] != "profile@test.com" {
		t.Errorf("email: got %v, want 'profile@test.com'", item["email"])
	}
}

func TestE2E_RestorePassword(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	user := suite.seedUser(t, "restore-pwd@test.com", "original-pass", "Restore Pwd", roleID, true, nil)

	token := suite.authToken(uuid.New().String(), "admin")

	// Admin restores password for user
	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/users/"+user.ID.String()+"/restore-password"), nil, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	// Verify new password was set — login with old password should fail
	loginResp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "restore-pwd@test.com", "password": "original-pass"}, "")
	defer loginResp.Body.Close()
	if loginResp.StatusCode == http.StatusOK {
		t.Error("expected login with old password to fail after password restore")
	}

	// Verify email was sent
	email := suite.emailSvc.last()
	if email == nil {
		t.Fatal("expected email on password restore")
	}
	if !strings.Contains(email.Body, "contraseña ha sido restablecida") {
		t.Error("expected restore notification in email body")
	}
}

// ============================================================
//  HISTORY 7: Health check
// ============================================================

func TestE2E_HealthCheck(t *testing.T) {
	suite := suiteForTest(t)

	resp := suite.httpDo(t, http.MethodGet, suite.rawURL("/health"), nil, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var health map[string]string
	if err := json.Unmarshal([]byte(readBody(t, resp)), &health); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	status, ok := health["status"]
	if !ok || status != "ok" {
		t.Errorf("expected status=ok, got %v", health)
	}
}

// ============================================================
//  HISTORY 8: Email — verificar envío en flujos clave
// ============================================================

func TestE2E_Email_ForgotPassword(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.ensureAdminRole(t)
	suite.seedUser(t, "email-forgot@test.com", "pass", "Email Test", roleID, true, nil)

	suite.emailSvc.reset()
	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/forgot-password"),
		map[string]string{"email": "email-forgot@test.com"}, "")
	defer resp.Body.Close()

	email := suite.emailSvc.last()
	if email == nil {
		t.Fatal("expected email on forgot-password")
	}
	if !strings.Contains(email.Body, "reset-password?token=") {
		t.Error("expected reset link in body")
	}
	if !strings.Contains(email.Body, "autoinsight.com") {
		t.Error("expected reset link with domain in body")
	}
}

func TestE2E_Email_UserCreation(t *testing.T) {
	suite := suiteForTest(t)

	adminID := uuid.New().String()
	token := suite.authToken(adminID, "admin")
	roleID := suite.getRoleID(t, "admin")

	suite.emailSvc.reset()
	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/users"),
		map[string]any{
			"email":     "email-create@test.com",
			"full_name": "Email Create",
			"password":  "Secret99!",
			"role_id":   roleID.String(),
			"is_active": true,
		}, token)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	email := suite.emailSvc.last()
	if email == nil {
		t.Fatal("expected welcome email on user creation")
	}
	if email.To != "email-create@test.com" {
		t.Errorf("To: got %q, want 'email-create@test.com'", email.To)
	}
	if !strings.Contains(email.Body, "Secret99!") {
		t.Error("expected email to include the password")
	}
	if !strings.Contains(email.Body, "Plataforma de Autodiagnóstico DTI") {
		t.Error("expected welcome message with app name in email body")
	}
}

// ============================================================
//  HISTORY 9: Login con DestinationID
// ============================================================

func TestE2E_Login_WithDestinationID(t *testing.T) {
	suite := suiteForTest(t)

	destID := uuid.MustParse("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
	roleID := suite.getRoleID(t, "gestor_destino")
	suite.seedUser(t, "dest@test.com", "pass123", "Dest User", roleID, true, &destID)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "dest@test.com", "password": "pass123"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var lr loginResp
	if err := json.Unmarshal([]byte(readBody(t, resp)), &lr); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if lr.DestinationID == nil {
		t.Fatal("expected DestinationID to be non-nil for gestor_destino")
	}
	if *lr.DestinationID != destID.String() {
		t.Errorf("DestinationID: got %v, want %v", *lr.DestinationID, destID.String())
	}
}

func TestE2E_Login_AdminNoDestinationID(t *testing.T) {
	suite := suiteForTest(t)

	roleID := suite.getRoleID(t, "admin")
	suite.seedUser(t, "admin-only@test.com", "admin123", "Admin Only", roleID, true, nil)

	resp := suite.httpDo(t, http.MethodPost, suite.apiURL("/auth/login"),
		map[string]string{"email": "admin-only@test.com", "password": "admin123"}, "")
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, readBody(t, resp))
	}

	var lr loginResp
	if err := json.Unmarshal([]byte(readBody(t, resp)), &lr); err != nil {
		t.Fatalf("failed to parse: %v", err)
	}
	if lr.DestinationID != nil {
		t.Error("expected DestinationID to be nil for global admin")
	}
}
