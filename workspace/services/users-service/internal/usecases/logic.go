package usecases

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"users-service/internal/domain"
	portin "users-service/internal/ports/in"
	portout "users-service/internal/ports/out"
)

// UserRepository defines the contract for reading users.
type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	FindAll(ctx context.Context) ([]*domain.User, error)
	Save(ctx context.Context, entity *domain.User) error
	Update(ctx context.Context, entity *domain.User) error
	Delete(ctx context.Context, id string) error
}

// RoleRepository defines the contract for reading roles.
type RoleRepository interface {
	FindByID(ctx context.Context, id string) (*domain.Role, error)
	FindAll(ctx context.Context) ([]*domain.Role, error)
}

// PasswordResetRepository defines the contract for password reset token persistence.
type PasswordResetRepository interface {
	Save(ctx context.Context, token *domain.PasswordResetToken) error
	FindByHash(ctx context.Context, tokenHash string) (*domain.PasswordResetToken, error)
	MarkUsed(ctx context.Context, tokenID uuid.UUID) error
}

// Logic implements portin.UsersServiceUseCase.
// This file is yours — the generator will never overwrite it.
type Logic struct {
	users             UserRepository
	roles             RoleRepository
	passwordResetRepo  PasswordResetRepository
	emailSvc           portout.EmailService
	templateRenderer   portout.TemplateRenderer
	frontendURL        string
	logoURL            string
}

// LogicOption is a functional option for configuring Logic.
type LogicOption func(*Logic)

// WithUserRepository injects a UserRepository.
func WithUserRepository(repo UserRepository) LogicOption {
	return func(l *Logic) {
		l.users = repo
	}
}

// WithRoleRepository injects a RoleRepository.
func WithRoleRepository(repo RoleRepository) LogicOption {
	return func(l *Logic) {
		l.roles = repo
	}
}

// WithPasswordResetRepository injects a PasswordResetRepository.
func WithPasswordResetRepository(repo PasswordResetRepository) LogicOption {
	return func(l *Logic) {
		l.passwordResetRepo = repo
	}
}

// WithEmailService injects an EmailService.
func WithEmailService(svc portout.EmailService) LogicOption {
	return func(l *Logic) {
		l.emailSvc = svc
	}
}

// WithTemplateRenderer injects a TemplateRenderer for rendering email bodies.
func WithTemplateRenderer(tr portout.TemplateRenderer) LogicOption {
	return func(l *Logic) {
		l.templateRenderer = tr
	}
}

// WithFrontendURL sets the base URL for links in email templates.
func WithFrontendURL(url string) LogicOption {
	return func(l *Logic) {
		l.frontendURL = url
	}
}

// WithLogoURL sets the absolute URL for the logo in email templates.
// Falls back to frontendURL + "/dti-logo.webp" when not set.
func WithLogoURL(url string) LogicOption {
	return func(l *Logic) {
		l.logoURL = url
	}
}

// NewLogic constructs the use case with its dependencies.
func NewLogic(opts ...LogicOption) *Logic {
	l := &Logic{}
	for _, opt := range opts {
		opt(l)
	}
	return l
}

// getLogoURL returns the logo URL for email templates.
// Uses the explicitly configured logo URL if set, otherwise uses the production DTI logo.
func (l *Logic) getLogoURL() string {
	if l.logoURL != "" {
		return l.logoURL
	}
	return "https://evaluacionesdti.rediberoamericanadti.org/dti-logo.webp"
}

// Ensure Logic satisfies the driving port at compile time.
var _ portin.UsersServiceUseCase = (*Logic)(nil)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserInactive       = errors.New("user account is disabled")
	ErrRoleNotFound       = errors.New("role not found")
)
