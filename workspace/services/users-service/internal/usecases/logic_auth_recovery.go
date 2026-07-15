package usecases

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"users-service/internal/domain"
)

var (
	ErrEmailNotRegistered     = errors.New("email not registered")
	ErrInvalidToken           = errors.New("invalid or expired reset token")
	ErrTokenExpired           = errors.New("reset token has expired")
	ErrTokenAlreadyUsed       = errors.New("reset token has already been used")
	ErrCurrentPasswordInvalid = errors.New("current password is incorrect")
	ErrPasswordTooShort       = errors.New("password must be at least 8 characters")
)

const (
	resetTokenTTL       = 1 * time.Hour
	resetTokenByteSize  = 64
	bcryptCost          = 10
)

// generateResetToken generates a cryptographically random token and its SHA-256 hash.
func generateResetToken() (rawToken string, hash string, err error) {
	buf := make([]byte, resetTokenByteSize)
	if _, err := rand.Read(buf); err != nil {
		return "", "", err
	}
	rawToken = hex.EncodeToString(buf)
	sum := sha256.Sum256([]byte(rawToken))
	hash = hex.EncodeToString(sum[:])
	return rawToken, hash, nil
}

// hashToken computes SHA-256 hash of a raw token string.
func hashToken(rawToken string) string {
	sum := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(sum[:])
}

// ForgotPassword handles the forgot-password flow:
// lookup user by email → generate random token → hash token → save to DB → send email.
// Always returns 200 OK to prevent user enumeration.
func (l *Logic) ForgotPassword(ctx context.Context, email string) error {
	// Lookup user (silently return if not found — no user enumeration)
	user, err := l.users.FindByEmail(ctx, email)
	if err != nil {
		log.Printf("ForgotPassword: user lookup failed for %s: %v", email, err)
		return nil
	}
	if user == nil {
		log.Printf("ForgotPassword: no user found for %s", email)
		return nil
	}

	// Generate random token
	rawToken, tokenHash, err := generateResetToken()
	if err != nil {
		log.Printf("ForgotPassword: failed to generate token for %s: %v", email, err)
		return nil
	}

	// Save token to DB
	now := time.Now()
	token := &domain.PasswordResetToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(resetTokenTTL),
		CreatedAt: now,
	}

	if err := l.passwordResetRepo.Save(ctx, token); err != nil {
		log.Printf("ForgotPassword: failed to save token for %s: %v", email, err)
		return nil
	}

	// Dispatch email
	if l.emailSvc != nil {
		resetURL := l.frontendURL + "/auth/reset-password?token=" + rawToken
		body, tmplErr := l.renderPasswordResetEmail(user.FullName, resetURL)
		if tmplErr != nil {
			log.Printf("ForgotPassword: failed to render template: %v", tmplErr)
			body = "Hola " + user.FullName + ",\n\n" +
				"Recibiste este correo porque solicitaste restablecer tu contraseña.\n\n" +
				"Haz clic en el siguiente enlace para restablecerla:\n" + resetURL + "\n\n" +
				"Este enlace expira en 1 hora.\n\n" +
				"Si no solicitaste este cambio, ignora este mensaje."
		}
		if err := l.emailSvc.SendEmail(email, "Restablecer tu contraseña - Plataforma de Autodiagnóstico DTI - Red Iberoamericana DTI", body); err != nil {
			log.Printf("ForgotPassword: failed to send email to %s: %v", email, err)
			// Non-fatal — token was saved, user can retry
		}
	} else {
		log.Printf("ForgotPassword: email service not configured, raw token: %s", rawToken)
	}

	return nil
}

// CompleteOnboarding lets a first-login user set their password without
// providing the current password (they just authenticated via login).
// It also sets first_login = false so subsequent logins go directly to the app.
func (l *Logic) CompleteOnboarding(ctx context.Context, userID, newPassword string) error {
	if len(newPassword) < 8 {
		return ErrPasswordTooShort
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}

	user, err := l.users.FindByID(ctx, uid.String())
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcryptCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.PasswordHash = string(hashedPassword)
	user.FirstLogin = false
	user.UpdatedAt = time.Now()
	if err := l.users.Update(ctx, user); err != nil {
		return err
	}

	log.Printf("CompleteOnboarding: password set and first_login cleared for user %s", user.ID)
	return nil
}

// ChangePassword lets an authenticated user change their own password.
// Requires the current password to be re-entered as a safety check. The userID
// comes from the JWT (not the request body) so a logged-in user can only change
// their own password, not someone else's.
func (l *Logic) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	if len(newPassword) < 8 {
		return ErrPasswordTooShort
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}

	user, err := l.users.FindByID(ctx, uid.String())
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return ErrCurrentPasswordInvalid
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcryptCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.PasswordHash = string(hashedPassword)
	user.UpdatedAt = time.Now()
	if err := l.users.Update(ctx, user); err != nil {
		return err
	}

	log.Printf("ChangePassword: password changed for user %s", user.ID)
	return nil
}

// ResetPassword handles the reset-password flow:
// hash token → findByHash → validate not expired/used → hash new password → update user → mark token used.
func (l *Logic) ResetPassword(ctx context.Context, rawToken string, newPassword string) error {
	// 1. Hash the incoming token
	tokenHash := hashToken(rawToken)

	// 2. Look up by hash
	token, err := l.passwordResetRepo.FindByHash(ctx, tokenHash)
	if err != nil {
		return ErrInvalidToken
	}
	if token == nil {
		return ErrInvalidToken
	}

	// 3. Validate not expired
	if time.Now().After(token.ExpiresAt) {
		return ErrTokenExpired
	}

	// 4. Validate not already used
	if token.UsedAt != nil {
		return ErrTokenAlreadyUsed
	}

	// 5. Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcryptCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	// 6. Update user's password
	user, err := l.users.FindByID(ctx, token.UserID.String())
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	user.PasswordHash = string(hashedPassword)
	user.UpdatedAt = time.Now()

	if err := l.users.Update(ctx, user); err != nil {
		return err
	}

	// 7. Mark token as used
	if err := l.passwordResetRepo.MarkUsed(ctx, token.ID); err != nil {
		log.Printf("ResetPassword: failed to mark token %s as used: %v", token.ID, err)
		// Non-fatal — password was already updated
	}

	log.Printf("ResetPassword: password reset successfully for user %s", user.ID)
	return nil
}

// RestorePasswordForUser generates a new random password for a user (admin-initiated restore).
// The user is looked up by ID, the password is hashed and saved, and an email is sent.
func (l *Logic) RestorePasswordForUser(ctx context.Context, id string) error {
	user, err := l.users.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Generate new random password
	rawPassword := generateRandomPassword(16)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcryptCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.PasswordHash = string(hashedPassword)
	user.FirstLogin = true
	user.UpdatedAt = time.Now()
	if err := l.users.Update(ctx, user); err != nil {
		return err
	}

	// Send email with new credentials
	if l.emailSvc != nil {
		body, tmplErr := l.renderWelcomeEmail(user.FullName, user.Email, rawPassword)
		if tmplErr != nil {
			log.Printf("RestorePasswordForUser: failed to render template: %v", tmplErr)
			body = "Hola " + user.FullName + ",\n\n" +
				"Tu contraseña ha sido restablecida por un administrador.\n\n" +
				"Nueva contraseña: " + rawPassword + "\n\n" +
				"Te recomendamos cambiar tu contraseña después de iniciar sesión."
		}
		if err := l.emailSvc.SendEmail(user.Email, "Tu contraseña ha sido restablecida - Plataforma de Autodiagnóstico DTI - Red Iberoamericana DTI", body); err != nil {
			log.Printf("RestorePasswordForUser: failed to send email to %s: %v", user.Email, err)
		}
	}

	log.Printf("RestorePasswordForUser: password restored for user %s", user.ID)
	return nil
}

// generateRandomPassword generates a cryptographically random password of the given length.
func generateRandomPassword(length int) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		// Fallback to a less secure but still usable password
		return "TempPass123!"
	}
	for i := 0; i < length; i++ {
		buf[i] = charset[int(buf[i])%len(charset)]
	}
	return string(buf)
}

// renderPasswordResetEmail renders the password reset email template.
// Falls back to plain text if template engine is not configured.
func (l *Logic) renderPasswordResetEmail(fullName, resetURL string) (string, error) {
	if l.templateRenderer == nil {
		return "", errors.New("template renderer not configured")
	}
	return l.templateRenderer.Render("password_reset.html", map[string]any{
		"FullName":  fullName,
		"ResetURL":  resetURL,
		"ExpiresIn": "1 hora",
		"LogoURL":   l.getLogoURL(),
	})
}
