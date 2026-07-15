package portout

import (
	"context"

	"github.com/google/uuid"
	"users-service/internal/domain"
)

// PasswordResetRepository is the driven port for persisting password reset tokens.
// Implement this in internal/adapters/out/postgres/repository_password_reset.go.
type PasswordResetRepository interface {
	Save(ctx context.Context, token *domain.PasswordResetToken) error
	FindByHash(ctx context.Context, tokenHash string) (*domain.PasswordResetToken, error)
	MarkUsed(ctx context.Context, tokenID uuid.UUID) error
}
