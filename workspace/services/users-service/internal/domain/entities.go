package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// PermissionSet defines the granular permissions for a role.
type PermissionSet struct {
	AccessScope             string   `json:"access_scope"`
	CanWriteValues          bool     `json:"can_write_values"`
	CanManageUsers          bool     `json:"can_manage_users"`
	CanApproveGoodPractices bool     `json:"can_approve_good_practices"`
	EvaluationTypes         []string `json:"evaluation_types"`
}

// LoginRequest is a domain entity.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse is a domain entity.
type LoginResponse struct {
	Token         string        `json:"token"`
	User          uuid.UUID     `json:"user"`
	Role          string        `json:"role"`
	DestinationID *uuid.UUID    `json:"destination_id,omitempty"`
	Permissions   PermissionSet `json:"permissions"`
	FirstLogin    bool          `json:"first_login"`
}

// RegisterRequest is a domain entity.
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

// HealthResponse is a domain entity.
type HealthResponse struct {
	Status string
}

// RootResponse is a domain entity.
type RootResponse struct {
	Message string
}

// UserProfile is a domain entity representing extended profile fields.
type UserProfile struct {
	ID          uuid.UUID       `json:"id"`
	UserID      uuid.UUID       `json:"user_id"`
	AvatarURL   string          `json:"avatar_url"`
	Bio         string          `json:"bio"`
	Preferences json.RawMessage `json:"preferences"`
	FullName    string          `json:"full_name"`
	Email       string          `json:"email"`
	Phone       string          `json:"phone"`
}

// User is a domain entity.
type User struct {
	ID            uuid.UUID  `json:"id"`
	Email         string     `json:"email"`
	PasswordHash  string     `json:"-"`
	FullName      string     `json:"full_name"`
	Phone         string     `json:"phone,omitempty"`
	RoleID        uuid.UUID  `json:"role_id"`
	DestinationID *uuid.UUID `json:"destination_id,omitempty"`
	IsActive      bool       `json:"is_active"`
	FirstLogin    bool       `json:"first_login"`
	Password      string     `json:"password,omitempty"` // input-only: plain text password for user creation
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// Role is a domain entity.
type Role struct {
	ID          uuid.UUID
	Name        string
	Description string
	Permissions json.RawMessage
}

// UserHistory is a domain entity for audit history of User changes.
type UserHistory struct {
	HistoryID uuid.UUID
	EntityID  uuid.UUID
	Operation string
	OldData   string
	NewData   string
	ChangedBy string
	ChangedAt time.Time
}

// PasswordResetToken is a domain entity for password recovery tokens.
type PasswordResetToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
	CreatedAt time.Time
}

// AuditLog is a domain entity.
type AuditLog struct {
	ID         uuid.UUID
	EntityType string
	EntityID   uuid.UUID
	Action     string
	OldValue   json.RawMessage
	NewValue   json.RawMessage
	ChangedBy  uuid.UUID
	ChangedAt  time.Time
	IPAddress  string
}

