package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"

	"github.com/google/uuid"

	"users-service/internal/domain"
	portout "users-service/internal/ports/out"
)

// DB is an alias for *sql.DB to keep the code concise.
type DB = sql.DB


// LoginRequestRepo implements portout.LoginRequestRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type LoginRequestRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewLoginRequestRepo constructs the repository.
func NewLoginRequestRepo( /* db *pgxpool.Pool */ ) *LoginRequestRepo {
	return &LoginRequestRepo{}
}

// Ensure LoginRequestRepo satisfies the driven port at compile time.
var _ portout.LoginRequestRepository = (*LoginRequestRepo)(nil)

func (r *LoginRequestRepo) FindByID(ctx context.Context, id string) (*domain.LoginRequest, error) {
	panic("LoginRequestRepo.FindByID: not implemented")
}

func (r *LoginRequestRepo) FindAll(ctx context.Context) ([]*domain.LoginRequest, error) {
	panic("LoginRequestRepo.FindAll: not implemented")
}

func (r *LoginRequestRepo) Save(ctx context.Context, entity *domain.LoginRequest) error {
	panic("LoginRequestRepo.Save: not implemented")
}

func (r *LoginRequestRepo) Update(ctx context.Context, entity *domain.LoginRequest) error {
	panic("LoginRequestRepo.Update: not implemented")
}

func (r *LoginRequestRepo) Delete(ctx context.Context, id string) error {
	panic("LoginRequestRepo.Delete: not implemented")
}

// LoginResponseRepo implements portout.LoginResponseRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type LoginResponseRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewLoginResponseRepo constructs the repository.
func NewLoginResponseRepo( /* db *pgxpool.Pool */ ) *LoginResponseRepo {
	return &LoginResponseRepo{}
}

// Ensure LoginResponseRepo satisfies the driven port at compile time.
var _ portout.LoginResponseRepository = (*LoginResponseRepo)(nil)

func (r *LoginResponseRepo) FindByID(ctx context.Context, id string) (*domain.LoginResponse, error) {
	panic("LoginResponseRepo.FindByID: not implemented")
}

func (r *LoginResponseRepo) FindAll(ctx context.Context) ([]*domain.LoginResponse, error) {
	panic("LoginResponseRepo.FindAll: not implemented")
}

func (r *LoginResponseRepo) Save(ctx context.Context, entity *domain.LoginResponse) error {
	panic("LoginResponseRepo.Save: not implemented")
}

func (r *LoginResponseRepo) Update(ctx context.Context, entity *domain.LoginResponse) error {
	panic("LoginResponseRepo.Update: not implemented")
}

func (r *LoginResponseRepo) Delete(ctx context.Context, id string) error {
	panic("LoginResponseRepo.Delete: not implemented")
}

// RegisterRequestRepo implements portout.RegisterRequestRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type RegisterRequestRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewRegisterRequestRepo constructs the repository.
func NewRegisterRequestRepo( /* db *pgxpool.Pool */ ) *RegisterRequestRepo {
	return &RegisterRequestRepo{}
}

// Ensure RegisterRequestRepo satisfies the driven port at compile time.
var _ portout.RegisterRequestRepository = (*RegisterRequestRepo)(nil)

func (r *RegisterRequestRepo) FindByID(ctx context.Context, id string) (*domain.RegisterRequest, error) {
	panic("RegisterRequestRepo.FindByID: not implemented")
}

func (r *RegisterRequestRepo) FindAll(ctx context.Context) ([]*domain.RegisterRequest, error) {
	panic("RegisterRequestRepo.FindAll: not implemented")
}

func (r *RegisterRequestRepo) Save(ctx context.Context, entity *domain.RegisterRequest) error {
	panic("RegisterRequestRepo.Save: not implemented")
}

func (r *RegisterRequestRepo) Update(ctx context.Context, entity *domain.RegisterRequest) error {
	panic("RegisterRequestRepo.Update: not implemented")
}

func (r *RegisterRequestRepo) Delete(ctx context.Context, id string) error {
	panic("RegisterRequestRepo.Delete: not implemented")
}

// HealthResponseRepo implements portout.HealthResponseRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type HealthResponseRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewHealthResponseRepo constructs the repository.
func NewHealthResponseRepo( /* db *pgxpool.Pool */ ) *HealthResponseRepo {
	return &HealthResponseRepo{}
}

// Ensure HealthResponseRepo satisfies the driven port at compile time.
var _ portout.HealthResponseRepository = (*HealthResponseRepo)(nil)

func (r *HealthResponseRepo) FindByID(ctx context.Context, id string) (*domain.HealthResponse, error) {
	panic("HealthResponseRepo.FindByID: not implemented")
}

func (r *HealthResponseRepo) FindAll(ctx context.Context) ([]*domain.HealthResponse, error) {
	panic("HealthResponseRepo.FindAll: not implemented")
}

func (r *HealthResponseRepo) Save(ctx context.Context, entity *domain.HealthResponse) error {
	panic("HealthResponseRepo.Save: not implemented")
}

func (r *HealthResponseRepo) Update(ctx context.Context, entity *domain.HealthResponse) error {
	panic("HealthResponseRepo.Update: not implemented")
}

func (r *HealthResponseRepo) Delete(ctx context.Context, id string) error {
	panic("HealthResponseRepo.Delete: not implemented")
}

// RootResponseRepo implements portout.RootResponseRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type RootResponseRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewRootResponseRepo constructs the repository.
func NewRootResponseRepo( /* db *pgxpool.Pool */ ) *RootResponseRepo {
	return &RootResponseRepo{}
}

// Ensure RootResponseRepo satisfies the driven port at compile time.
var _ portout.RootResponseRepository = (*RootResponseRepo)(nil)

func (r *RootResponseRepo) FindByID(ctx context.Context, id string) (*domain.RootResponse, error) {
	panic("RootResponseRepo.FindByID: not implemented")
}

func (r *RootResponseRepo) FindAll(ctx context.Context) ([]*domain.RootResponse, error) {
	panic("RootResponseRepo.FindAll: not implemented")
}

func (r *RootResponseRepo) Save(ctx context.Context, entity *domain.RootResponse) error {
	panic("RootResponseRepo.Save: not implemented")
}

func (r *RootResponseRepo) Update(ctx context.Context, entity *domain.RootResponse) error {
	panic("RootResponseRepo.Update: not implemented")
}

func (r *RootResponseRepo) Delete(ctx context.Context, id string) error {
	panic("RootResponseRepo.Delete: not implemented")
}

// UserProfileRepo implements portout.UserProfileRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type UserProfileRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewUserProfileRepo constructs the repository.
func NewUserProfileRepo( /* db *pgxpool.Pool */ ) *UserProfileRepo {
	return &UserProfileRepo{}
}

// Ensure UserProfileRepo satisfies the driven port at compile time.
var _ portout.UserProfileRepository = (*UserProfileRepo)(nil)

func (r *UserProfileRepo) FindByID(ctx context.Context, id string) (*domain.UserProfile, error) {
	panic("UserProfileRepo.FindByID: not implemented")
}

func (r *UserProfileRepo) FindAll(ctx context.Context) ([]*domain.UserProfile, error) {
	panic("UserProfileRepo.FindAll: not implemented")
}

func (r *UserProfileRepo) Save(ctx context.Context, entity *domain.UserProfile) error {
	panic("UserProfileRepo.Save: not implemented")
}

func (r *UserProfileRepo) Update(ctx context.Context, entity *domain.UserProfile) error {
	panic("UserProfileRepo.Update: not implemented")
}

func (r *UserProfileRepo) Delete(ctx context.Context, id string) error {
	panic("UserProfileRepo.Delete: not implemented")
}

// UserRepo implements portout.UserRepository and usecases.UserRepository backed by PostgreSQL.
type UserRepo struct {
	db *DB
}

// NewUserRepo constructs the repository with a DB connection.
func NewUserRepo(db *DB) *UserRepo {
	return &UserRepo{db: db}
}

// Ensure UserRepo satisfies the driven port at compile time.
var _ portout.UserRepository = (*UserRepo)(nil)

// scanUser scans a row into a domain.User, handling nullable DestinationID.
func scanUser(scanner interface {
	Scan(dest ...interface{}) error
}) (*domain.User, error) {
	var (
		u            domain.User
		phone        sql.NullString
		destID       sql.NullString
		isActive     bool
		firstLogin   bool
		createdAt    sql.NullTime
		updatedAt    sql.NullTime
	)
	if err := scanner.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &phone,
		&u.RoleID, &destID, &isActive, &firstLogin, &createdAt, &updatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No existe → no error, se maneja en usecase
		}
		return nil, err
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	u.IsActive = isActive
	u.FirstLogin = firstLogin
	if destID.Valid {
		uid, err := uuid.Parse(destID.String)
		if err != nil {
			return nil, err
		}
		u.DestinationID = &uid
	}
	if createdAt.Valid {
		u.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		u.UpdatedAt = updatedAt.Time
	}
	return &u, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, passwordhash, fullname, phone, roleid, destinationid, isactive, firstlogin, createdat, updatedat
		FROM "user"
		WHERE email = $1
	`, email)
	return scanUser(row)
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, passwordhash, fullname, phone, roleid, destinationid, isactive, firstlogin, createdat, updatedat
		FROM "user"
		WHERE id = $1
	`, id)
	return scanUser(row)
}

func (r *UserRepo) FindAll(ctx context.Context) ([]*domain.User, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, email, passwordhash, fullname, phone, roleid, destinationid, isactive, firstlogin, createdat, updatedat
		FROM "user"
		ORDER BY createdat DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *UserRepo) Save(ctx context.Context, entity *domain.User) error {
	log.Printf("[UserRepo.Save] db=%p entity.ID=%s email=%s roleID=%s", r.db, entity.ID, entity.Email, entity.RoleID)
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO "user" (id, email, passwordhash, fullname, phone, roleid, destinationid, isactive, firstlogin, createdat, updatedat)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, entity.ID, entity.Email, entity.PasswordHash, entity.FullName, entity.Phone,
		entity.RoleID, entity.DestinationID, entity.IsActive, entity.FirstLogin, entity.CreatedAt, entity.UpdatedAt)
	if err != nil {
		log.Printf("[UserRepo.Save] INSERT ERROR: %v", err)
	} else {
		log.Printf("[UserRepo.Save] INSERT SUCCESS")
	}
	return err
}

func (r *UserRepo) Update(ctx context.Context, entity *domain.User) error {
	// When PasswordHash is empty (e.g. frontend PUT without password field),
	// skip updating it to avoid wiping the user's password.
	if entity.PasswordHash == "" {
		_, err := r.db.ExecContext(ctx, `
			UPDATE "user"
			SET email = $1, fullname = $2, phone = $3, roleid = $4,
			    destinationid = $5, isactive = $6, firstlogin = $7, updatedat = $8
			WHERE id = $9
		`, entity.Email, entity.FullName, entity.Phone, entity.RoleID,
			entity.DestinationID, entity.IsActive, entity.FirstLogin, entity.UpdatedAt, entity.ID)
		return err
	}
	_, err := r.db.ExecContext(ctx, `
		UPDATE "user"
		SET email = $1, passwordhash = $2, fullname = $3, phone = $4, roleid = $5,
		    destinationid = $6, isactive = $7, firstlogin = $8, updatedat = $9
		WHERE id = $10
	`, entity.Email, entity.PasswordHash, entity.FullName, entity.Phone, entity.RoleID,
		entity.DestinationID, entity.IsActive, entity.FirstLogin, entity.UpdatedAt, entity.ID)
	return err
}

func (r *UserRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM "user" WHERE id = $1`, id)
	return err
}

// RoleRepo implements portout.RoleRepository and usecases.RoleRepository backed by PostgreSQL.
type RoleRepo struct {
	db *DB
}

// NewRoleRepo constructs the repository with a DB connection.
func NewRoleRepo(db *DB) *RoleRepo {
	return &RoleRepo{db: db}
}

// Ensure RoleRepo satisfies the driven port at compile time.
var _ portout.RoleRepository = (*RoleRepo)(nil)

// scanRole scans a row into a domain.Role, handling JSON permissions.
func scanRole(scanner interface {
	Scan(dest ...interface{}) error
}) (*domain.Role, error) {
	var (
		r       domain.Role
		permsJSON sql.NullString
	)
	if err := scanner.Scan(&r.ID, &r.Name, &r.Description, &permsJSON); err != nil {
		return nil, err
	}
	if permsJSON.Valid {
		r.Permissions = json.RawMessage(permsJSON.String)
	}
	return &r, nil
}

func (r *RoleRepo) FindByID(ctx context.Context, id string) (*domain.Role, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, description, permissions
		FROM role
		WHERE id = $1
	`, id)
	return scanRole(row)
}

func (r *RoleRepo) FindAll(ctx context.Context) ([]*domain.Role, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, description, permissions
		FROM role
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*domain.Role
	for rows.Next() {
		role, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

func (r *RoleRepo) Save(ctx context.Context, entity *domain.Role) error {
	permsStr := ""
	if len(entity.Permissions) > 0 {
		permsStr = string(entity.Permissions)
	}
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO role (id, name, description, permissions)
		VALUES ($1, $2, $3, $4)
	`, entity.ID, entity.Name, entity.Description, permsStr)
	return err
}

func (r *RoleRepo) Update(ctx context.Context, entity *domain.Role) error {
	permsStr := ""
	if len(entity.Permissions) > 0 {
		permsStr = string(entity.Permissions)
	}
	_, err := r.db.ExecContext(ctx, `
		UPDATE role SET name = $1, description = $2, permissions = $3 WHERE id = $4
	`, entity.Name, entity.Description, permsStr, entity.ID)
	return err
}

func (r *RoleRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM role WHERE id = $1`, id)
	return err
}

// AuditLogRepo implements portout.AuditLogRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type AuditLogRepo struct {
	// db *pgxpool.Pool  // inject your DB connection here
}

// NewAuditLogRepo constructs the repository.
func NewAuditLogRepo( /* db *pgxpool.Pool */ ) *AuditLogRepo {
	return &AuditLogRepo{}
}

// Ensure AuditLogRepo satisfies the driven port at compile time.
var _ portout.AuditLogRepository = (*AuditLogRepo)(nil)

func (r *AuditLogRepo) FindByID(ctx context.Context, id string) (*domain.AuditLog, error) {
	panic("AuditLogRepo.FindByID: not implemented")
}

func (r *AuditLogRepo) FindAll(ctx context.Context) ([]*domain.AuditLog, error) {
	panic("AuditLogRepo.FindAll: not implemented")
}

func (r *AuditLogRepo) Save(ctx context.Context, entity *domain.AuditLog) error {
	panic("AuditLogRepo.Save: not implemented")
}

func (r *AuditLogRepo) Update(ctx context.Context, entity *domain.AuditLog) error {
	panic("AuditLogRepo.Update: not implemented")
}

func (r *AuditLogRepo) Delete(ctx context.Context, id string) error {
	panic("AuditLogRepo.Delete: not implemented")
}

