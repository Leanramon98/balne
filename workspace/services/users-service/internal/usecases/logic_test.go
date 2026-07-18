package usecases

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	httpadapter "users-service/internal/adapters/in/http"
	"users-service/internal/domain"
	portin "users-service/internal/ports/in"
)

// mockOrganizationRepo implements OrganizationRepository for testing neutral login.
type mockOrganizationRepo struct {
	orgs map[uuid.UUID]*domain.Organization
}

func (m *mockOrganizationRepo) FindByPrincipalID(_ context.Context, _ uuid.UUID) (*domain.Organization, error) {
	for _, org := range m.orgs {
		return org, nil
	}
	return nil, nil
}

// mockMembershipRepo implements MembershipRepository for testing neutral login.
type mockMembershipRepo struct {
	memberships []domain.Membership
}

func (m *mockMembershipRepo) FindByPrincipalID(_ context.Context, principalID uuid.UUID) (*domain.Membership, error) {
	for _, mem := range m.memberships {
		if mem.PrincipalID == principalID {
			return &mem, nil
		}
	}
	return nil, nil
}

// compile-time checks: ensure mock types satisfy use case interfaces
var _ OrganizationRepository = (*mockOrganizationRepo)(nil)
var _ MembershipRepository = (*mockMembershipRepo)(nil)

// mockUserRepo implements a simple in-memory user repository for testing.
type mockUserRepo struct {
	users map[string]*domain.User // keyed by email
}

func (m *mockUserRepo) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	u, ok := m.users[email]
	if !ok {
		return nil, nil // not found
	}
	return u, nil
}

func (m *mockUserRepo) FindByID(_ context.Context, id string) (*domain.User, error) {
	for _, u := range m.users {
		if u.ID.String() == id {
			return u, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepo) FindAll(_ context.Context) ([]*domain.User, error) {
	users := make([]*domain.User, 0, len(m.users))
	for _, u := range m.users {
		users = append(users, u)
	}
	return users, nil
}

func (m *mockUserRepo) Save(_ context.Context, entity *domain.User) error {
	if m.users == nil {
		m.users = make(map[string]*domain.User)
	}
	m.users[entity.Email] = entity
	return nil
}

func (m *mockUserRepo) Update(_ context.Context, entity *domain.User) error {
	if m.users == nil {
		m.users = make(map[string]*domain.User)
	}
	m.users[entity.Email] = entity
	return nil
}

func (m *mockUserRepo) Delete(_ context.Context, id string) error {
	for email, u := range m.users {
		if u.ID.String() == id {
			delete(m.users, email)
			break
		}
	}
	return nil
}

// mockRoleRepo implements a simple in-memory role repository for testing.
type mockRoleRepo struct {
	roles map[string]*domain.Role // keyed by ID string
}

func (m *mockRoleRepo) FindByID(_ context.Context, id string) (*domain.Role, error) {
	r, ok := m.roles[id]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *mockRoleRepo) FindAll(_ context.Context) ([]*domain.Role, error) {
	roles := make([]*domain.Role, 0, len(m.roles))
	for _, r := range m.roles {
		roles = append(roles, r)
	}
	return roles, nil
}

func TestPostAuthLogin_NeutralLogin_Success(t *testing.T) {
	// RED: Verify login with org/membership returns neutral claims in JWT
	userID := uuid.New()
	roleID := uuid.New()
	orgID := uuid.MustParse("20000000-0000-0000-0000-000000000001")
	memID := uuid.MustParse("30000000-0000-0000-0000-000000000001")
	password := "secure-password-123"
	hashedPW, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	user := &domain.User{
		ID:           userID,
		Email:        "gestor@neutral.com",
		PasswordHash: string(hashedPW),
		FullName:     "Gestor Neutral",
		RoleID:       roleID,
		IsActive:     true,
		FirstLogin:   false,
		CreatedAt:    time.Now().Add(-24 * time.Hour),
		UpdatedAt:    time.Now(),
	}

	role := &domain.Role{
		ID:   roleID,
		Name: "gestor_destino",
	}

	orgRepo := &mockOrganizationRepo{
		orgs: map[uuid.UUID]*domain.Organization{orgID: {ID: orgID}},
	}
	memRepo := &mockMembershipRepo{
		memberships: []domain.Membership{{ID: memID, OrganizationID: orgID, PrincipalID: userID}},
	}
	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(
		WithUserRepository(userRepo),
		WithRoleRepository(roleRepo),
		WithOrganizationRepository(orgRepo),
		WithMembershipRepository(memRepo),
		WithDeploymentMode("saas"),
	)

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "gestor@neutral.com",
			Password: password,
		},
	}

	resp, err := logic.PostAuthLogin(context.Background(), req)
	if err != nil {
		t.Fatalf("PostAuthLogin with org/membership failed: %v", err)
	}
	if resp.Item == nil {
		t.Fatal("expected non-nil response item")
	}
	if resp.Item.Token == "" {
		t.Error("expected non-empty token")
	}

	// Parse the JWT and verify neutral claims
	parsed := &httpadapter.NeutralClaims{}
	_, parseErr := jwt.ParseWithClaims(resp.Item.Token, parsed, func(token *jwt.Token) (interface{}, error) {
		return httpadapter.JWTSecret, nil
	})
	if parseErr != nil {
		t.Fatalf("failed to parse JWT neutral claims: %v", parseErr)
	}
	if parsed.SubjectID == "" {
		t.Error("expected SubjectID in neutral claims")
	}
	if parsed.OrganizationID == "" {
		t.Error("expected OrganizationID in neutral claims")
	}
	if parsed.MembershipID == "" {
		t.Error("expected MembershipID in neutral claims")
	}
	if parsed.DeploymentMode != "saas" {
		t.Errorf("DeploymentMode: got %q, want 'saas'", parsed.DeploymentMode)
	}

	// Also verify response has neutral fields
	if resp.Item.OrganizationID == nil || *resp.Item.OrganizationID != orgID {
		t.Errorf("LoginResponse.OrganizationID: got %v, want %v", resp.Item.OrganizationID, orgID)
	}
	if resp.Item.MembershipID == nil || *resp.Item.MembershipID != memID {
		t.Errorf("LoginResponse.MembershipID: got %v, want %v", resp.Item.MembershipID, memID)
	}
	if resp.Item.DeploymentMode != "saas" {
		t.Errorf("LoginResponse.DeploymentMode: got %q, want 'saas'", resp.Item.DeploymentMode)
	}
}

func TestPostAuthLogin_LegacyFallback(t *testing.T) {
	// RED: Verify user without org/membership still gets legacy DTI JWT
	userID := uuid.New()
	roleID := uuid.New()
	password := "legacy-password"
	hashedPW, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	user := &domain.User{
		ID:           userID,
		Email:        "legacy@dti.com",
		PasswordHash: string(hashedPW),
		FullName:     "Legacy User",
		RoleID:       roleID,
		IsActive:     true,
	}

	role := &domain.Role{
		ID:   roleID,
		Name: "admin",
	}

	// Empty org/membership repos — no neutral data
	orgRepo := &mockOrganizationRepo{orgs: map[uuid.UUID]*domain.Organization{}}
	memRepo := &mockMembershipRepo{}
	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(
		WithUserRepository(userRepo),
		WithRoleRepository(roleRepo),
		WithOrganizationRepository(orgRepo),
		WithMembershipRepository(memRepo),
	)

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "legacy@dti.com",
			Password: password,
		},
	}

	resp, err := logic.PostAuthLogin(context.Background(), req)
	if err != nil {
		t.Fatalf("PostAuthLogin legacy fallback failed: %v", err)
	}
	if resp.Item == nil {
		t.Fatal("expected non-nil response item")
	}
	if resp.Item.Token == "" {
		t.Error("expected non-empty token")
	}

	// Verify legacy DTI claims are present
	parsed := &httpadapter.ExtendedClaims{}
	_, parseErr := jwt.ParseWithClaims(resp.Item.Token, parsed, func(token *jwt.Token) (interface{}, error) {
		return httpadapter.JWTSecret, nil
	})
	if parseErr != nil {
		t.Fatalf("failed to parse legacy DTI claims: %v", parseErr)
	}
	if parsed.UserID == "" {
		t.Error("expected UserID in legacy claims")
	}
	if parsed.Role != "admin" {
		t.Errorf("Role: got %q, want 'admin'", parsed.Role)
	}

	// Neutral fields should be nil/empty for legacy fallback
	if resp.Item.OrganizationID != nil {
		t.Error("expected OrganizationID to be nil for legacy user")
	}
	if resp.Item.MembershipID != nil {
		t.Error("expected MembershipID to be nil for legacy user")
	}
}

func TestPostAuthLogin_DualClaims(t *testing.T) {
	// RED: Verify login response includes BOTH neutral claims and legacy DTI fields
	userID := uuid.New()
	roleID := uuid.New()
	orgID := uuid.MustParse("20000000-0000-0000-0000-000000000001")
	memID := uuid.MustParse("30000000-0000-0000-0000-000000000001")
	destID := uuid.MustParse("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
	password := "dual-password"
	hashedPW, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	perms := domain.PermissionSet{
		AccessScope:    "destination",
		CanWriteValues: true,
	}
	permsJSON, _ := json.Marshal(perms)

	user := &domain.User{
		ID:            userID,
		Email:         "dual@test.com",
		PasswordHash:  string(hashedPW),
		FullName:      "Dual User",
		RoleID:        roleID,
		DestinationID: &destID,
		IsActive:      true,
	}

	role := &domain.Role{
		ID:          roleID,
		Name:        "gestor_destino",
		Permissions: permsJSON,
	}

	orgRepo := &mockOrganizationRepo{
		orgs: map[uuid.UUID]*domain.Organization{orgID: {ID: orgID}},
	}
	memRepo := &mockMembershipRepo{
		memberships: []domain.Membership{{ID: memID, OrganizationID: orgID, PrincipalID: userID}},
	}
	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(
		WithUserRepository(userRepo),
		WithRoleRepository(roleRepo),
		WithOrganizationRepository(orgRepo),
		WithMembershipRepository(memRepo),
		WithDeploymentMode("saas"),
	)

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "dual@test.com",
			Password: password,
		},
	}

	resp, err := logic.PostAuthLogin(context.Background(), req)
	if err != nil {
		t.Fatalf("PostAuthLogin dual claims failed: %v", err)
	}
	if resp.Item == nil {
		t.Fatal("expected non-nil response item")
	}

	// Parse neutral claims
	neutralParsed := &httpadapter.NeutralClaims{}
	_, err = jwt.ParseWithClaims(resp.Item.Token, neutralParsed, func(token *jwt.Token) (interface{}, error) {
		return httpadapter.JWTSecret, nil
	})
	if err != nil {
		t.Fatalf("failed to parse neutral claims: %v", err)
	}

	// Parse legacy DTI claims
	legacyParsed := &httpadapter.ExtendedClaims{}
	_, err = jwt.ParseWithClaims(resp.Item.Token, legacyParsed, func(token *jwt.Token) (interface{}, error) {
		return httpadapter.JWTSecret, nil
	})
	if err != nil {
		t.Fatalf("failed to parse legacy claims: %v", err)
	}

	// Both should have values
	if neutralParsed.SubjectID == "" {
		t.Error("expected SubjectID in dual claims")
	}
	if neutralParsed.OrganizationID == "" {
		t.Error("expected OrganizationID in dual claims")
	}
	if legacyParsed.UserID == "" {
		t.Error("expected UserID in legacy claims")
	}
	if legacyParsed.Role != "gestor_destino" {
		t.Errorf("Role in legacy claims: got %q, want 'gestor_destino'", legacyParsed.Role)
	}
}

func TestPostAuthLogin_DBError(t *testing.T) {
	// RED: Verify DB error during login returns error (handler maps to 500)
	userRepo := &mockUserRepo{users: map[string]*domain.User{}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{}}
	orgRepo := &mockOrganizationRepo{orgs: map[uuid.UUID]*domain.Organization{}}
	memRepo := &mockMembershipRepo{}

	logic := NewLogic(
		WithUserRepository(userRepo),
		WithRoleRepository(roleRepo),
		WithOrganizationRepository(orgRepo),
		WithMembershipRepository(memRepo),
	)

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "unknown@test.com",
			Password: "any-password",
		},
	}

	_, err := logic.PostAuthLogin(context.Background(), req)
	if err == nil {
		t.Fatal("expected error for unknown user, got nil")
	}
}

func TestPostAuthLogin_NeutralRolesIgnored(t *testing.T) {
	// RED: Verify neutral JWT does NOT include DTI roles/permissions/DestinationID
	userID := uuid.New()
	roleID := uuid.New()
	orgID := uuid.MustParse("20000000-0000-0000-0000-000000000001")
	memID := uuid.MustParse("30000000-0000-0000-0000-000000000001")
	password := "no-roles-pw"
	hashedPW, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)

	user := &domain.User{
		ID:           userID,
		Email:        "nofields@neutral.com",
		PasswordHash: string(hashedPW),
		FullName:     "No Fields",
		RoleID:       roleID,
		IsActive:     true,
	}
	role := &domain.Role{ID: roleID, Name: "consultor"}

	orgRepo := &mockOrganizationRepo{
		orgs: map[uuid.UUID]*domain.Organization{orgID: {ID: orgID}},
	}
	memRepo := &mockMembershipRepo{
		memberships: []domain.Membership{{ID: memID, OrganizationID: orgID, PrincipalID: userID}},
	}
	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(
		WithUserRepository(userRepo),
		WithRoleRepository(roleRepo),
		WithOrganizationRepository(orgRepo),
		WithMembershipRepository(memRepo),
		WithDeploymentMode("dedicated"),
	)

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "nofields@neutral.com",
			Password: password,
		},
	}

	resp, err := logic.PostAuthLogin(context.Background(), req)
	if err != nil {
		t.Fatalf("PostAuthLogin failed: %v", err)
	}

	// Parse into LoginClaims to see the full JWT
	full := &httpadapter.LoginClaims{}
	_, err = jwt.ParseWithClaims(resp.Item.Token, full, func(token *jwt.Token) (interface{}, error) {
		return httpadapter.JWTSecret, nil
	})
	if err != nil {
		t.Fatalf("failed to parse JWT: %v", err)
	}

	// Neutral claims present
	if full.SubjectID == "" {
		t.Error("expected SubjectID in neutral JWT")
	}
	if full.OrganizationID == "" {
		t.Error("expected OrganizationID in neutral JWT")
	}

	// Legacy claims present too (dual mode)
	if full.UserID == "" {
		t.Error("expected UserID in dual mode JWT")
	}
}

func TestPostAuthLogin_Success(t *testing.T) {
	// RED: Verify login with valid credentials returns extended LoginResponse
	userID := uuid.New()
	roleID := uuid.New()
	destID := uuid.MustParse("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
	password := "secure-password-123"
	hashedPW, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	perms := domain.PermissionSet{
		AccessScope:             "destination",
		CanWriteValues:          true,
		CanManageUsers:          true,
		CanApproveGoodPractices: false,
		EvaluationTypes:         []string{"autodiagnostico", "diagnostico"},
	}
	permsJSON, _ := json.Marshal(perms)

	user := &domain.User{
		ID:            userID,
		Email:         "gestor@destino.com",
		PasswordHash:  string(hashedPW),
		FullName:      "Gestor Destino",
		RoleID:        roleID,
		DestinationID: &destID,
		IsActive:      true,
		CreatedAt:     time.Now().Add(-24 * time.Hour),
		UpdatedAt:     time.Now(),
	}

	role := &domain.Role{
		ID:          roleID,
		Name:        "gestor_destino",
		Description: "Destination manager",
		Permissions: permsJSON,
	}

	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(WithUserRepository(userRepo), WithRoleRepository(roleRepo))

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "gestor@destino.com",
			Password: password,
		},
	}

	resp, err := logic.PostAuthLogin(context.Background(), req)
	if err != nil {
		t.Fatalf("PostAuthLogin failed: %v", err)
	}

	if resp.Item == nil {
		t.Fatal("expected non-nil response item")
	}

	if resp.Item.Token == "" {
		t.Error("expected non-empty token")
	}
	if resp.Item.User != userID {
		t.Errorf("User: got %v, want %v", resp.Item.User, userID)
	}
	if resp.Item.Role != "gestor_destino" {
		t.Errorf("Role: got %q, want 'gestor_destino'", resp.Item.Role)
	}
	if resp.Item.DestinationID == nil {
		t.Fatal("expected DestinationID to be non-nil")
	}
	if *resp.Item.DestinationID != destID {
		t.Errorf("DestinationID: got %v, want %v", *resp.Item.DestinationID, destID)
	}
	if resp.Item.Permissions.AccessScope != "destination" {
		t.Errorf("Permissions.AccessScope: got %q, want 'destination'", resp.Item.Permissions.AccessScope)
	}
}

func TestPostAuthLogin_WrongPassword(t *testing.T) {
	// RED: Verify login with wrong password returns error
	userID := uuid.New()
	roleID := uuid.New()
	hashedPW, _ := bcrypt.GenerateFromPassword([]byte("correct-password"), bcrypt.MinCost)

	user := &domain.User{
		ID:           userID,
		Email:        "user@test.com",
		PasswordHash: string(hashedPW),
		FullName:     "Test User",
		RoleID:       roleID,
		IsActive:     true,
	}

	role := &domain.Role{
		ID:   roleID,
		Name: "admin",
	}

	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(WithUserRepository(userRepo), WithRoleRepository(roleRepo))

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "user@test.com",
			Password: "wrong-password",
		},
	}

	_, err := logic.PostAuthLogin(context.Background(), req)
	if err == nil {
		t.Fatal("expected error for wrong password, got nil")
	}
}

func TestPostAuthLogin_UnknownEmail(t *testing.T) {
	// RED: Verify login with unknown email returns error
	userRepo := &mockUserRepo{users: map[string]*domain.User{}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{}}

	logic := NewLogic(WithUserRepository(userRepo), WithRoleRepository(roleRepo))

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "unknown@test.com",
			Password: "any-password",
		},
	}

	_, err := logic.PostAuthLogin(context.Background(), req)
	if err == nil {
		t.Fatal("expected error for unknown email, got nil")
	}
}

func TestPostAuthLogin_InactiveUser(t *testing.T) {
	// RED: Verify login with inactive user returns error
	userID := uuid.New()
	roleID := uuid.New()
	hashedPW, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.MinCost)

	user := &domain.User{
		ID:           userID,
		Email:        "inactive@test.com",
		PasswordHash: string(hashedPW),
		FullName:     "Inactive User",
		RoleID:       roleID,
		IsActive:     false,
	}

	role := &domain.Role{
		ID:   roleID,
		Name: "admin",
	}

	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(WithUserRepository(userRepo), WithRoleRepository(roleRepo))

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "inactive@test.com",
			Password: "password",
		},
	}

	_, err := logic.PostAuthLogin(context.Background(), req)
	if err == nil {
		t.Fatal("expected error for inactive user, got nil")
	}
}

func TestPostAuthLogin_AdminNoDestinationID(t *testing.T) {
	// RED: Verify admin login works without DestinationID
	userID := uuid.New()
	roleID := uuid.New()
	password := "admin-pass"
	hashedPW, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)

	perms := domain.PermissionSet{
		AccessScope: "global",
	}
	permsJSON, _ := json.Marshal(perms)

	user := &domain.User{
		ID:           userID,
		Email:        "admin@sistema.com",
		PasswordHash: string(hashedPW),
		FullName:     "Admin",
		RoleID:       roleID,
		IsActive:     true,
	}

	role := &domain.Role{
		ID:          roleID,
		Name:        "admin",
		Description: "Super admin",
		Permissions: permsJSON,
	}

	userRepo := &mockUserRepo{users: map[string]*domain.User{user.Email: user}}
	roleRepo := &mockRoleRepo{roles: map[string]*domain.Role{roleID.String(): role}}

	logic := NewLogic(WithUserRepository(userRepo), WithRoleRepository(roleRepo))

	req := portin.PostAuthLoginRequest{
		Body: &domain.LoginRequest{
			Email:    "admin@sistema.com",
			Password: password,
		},
	}

	resp, err := logic.PostAuthLogin(context.Background(), req)
	if err != nil {
		t.Fatalf("PostAuthLogin failed: %v", err)
	}

	if resp.Item.Role != "admin" {
		t.Errorf("Role: got %q, want 'admin'", resp.Item.Role)
	}
	if resp.Item.DestinationID != nil {
		t.Error("expected DestinationID to be nil for admin")
	}
	if resp.Item.Permissions.AccessScope != "global" {
		t.Errorf("Permissions.AccessScope: got %q, want 'global'", resp.Item.Permissions.AccessScope)
	}
}
