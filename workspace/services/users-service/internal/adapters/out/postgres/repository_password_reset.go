package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"

	"users-service/internal/domain"
	portout "users-service/internal/ports/out"
)

// PasswordResetRepo implements portout.PasswordResetRepository backed by PostgreSQL.
// This file is yours — the generator will never overwrite it.
type PasswordResetRepo struct {
	db *DB
}

// NewPasswordResetRepo constructs the repository with a DB connection.
func NewPasswordResetRepo(db *DB) *PasswordResetRepo {
	return &PasswordResetRepo{db: db}
}

// Ensure PasswordResetRepo satisfies the driven port at compile time.
var _ portout.PasswordResetRepository = (*PasswordResetRepo)(nil)

// scanPasswordResetToken scans a row into a domain.PasswordResetToken.
func scanPasswordResetToken(scanner interface {
	Scan(dest ...interface{}) error
}) (*domain.PasswordResetToken, error) {
	var (
		t       domain.PasswordResetToken
		usedAt  sql.NullTime
	)
	if err := scanner.Scan(
		&t.ID, &t.UserID, &t.TokenHash,
		&t.ExpiresAt, &usedAt, &t.CreatedAt,
	); err != nil {
		return nil, err
	}
	if usedAt.Valid {
		t.UsedAt = &usedAt.Time
	}
	return &t, nil
}

func (r *PasswordResetRepo) Save(ctx context.Context, token *domain.PasswordResetToken) error {
	var usedAt *time.Time
	if token.UsedAt != nil {
		usedAt = token.UsedAt
	}
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, token.ID, token.UserID, token.TokenHash, token.ExpiresAt, usedAt, token.CreatedAt)
	return err
}

func (r *PasswordResetRepo) FindByHash(ctx context.Context, tokenHash string) (*domain.PasswordResetToken, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, token_hash, expires_at, used_at, created_at
		FROM password_reset_tokens
		WHERE token_hash = $1
	`, tokenHash)
	return scanPasswordResetToken(row)
}

func (r *PasswordResetRepo) MarkUsed(ctx context.Context, tokenID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE password_reset_tokens
		SET used_at = NOW()
		WHERE id = $1
	`, tokenID)
	return err
}
