package usecases

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"users-service/internal/domain"
	portin "users-service/internal/ports/in"
)

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
