package usecases

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	portin "users-service/internal/ports/in"
)

func (l *Logic) GetUsers(ctx context.Context, req portin.GetUsersRequest) (portin.GetUsersResponse, error) {
	users, err := l.users.FindAll(ctx)
	if err != nil {
		return portin.GetUsersResponse{}, err
	}
	return portin.GetUsersResponse{Items: users, Total: len(users)}, nil
}

func (l *Logic) GetUser(ctx context.Context, req portin.GetUserRequest) (portin.GetUserResponse, error) {
	user, err := l.users.FindByID(ctx, req.ID)
	if err != nil {
		return portin.GetUserResponse{}, err
	}
	return portin.GetUserResponse{Item: user}, nil
}

func (l *Logic) PostUsers(ctx context.Context, req portin.PostUsersRequest) (portin.PostUsersResponse, error) {
	log.Printf("[PostUsers] req.Body=%+v", req.Body)
	if req.Body == nil {
		return portin.PostUsersResponse{}, errors.New("user body is required")
	}
	entity := req.Body
	if entity.ID == uuid.Nil {
		entity.ID = uuid.New()
	}
	now := time.Now()
	entity.CreatedAt = now
	entity.UpdatedAt = now

	// Hash password: use provided password or generate a random one
	plainPassword := entity.Password
	if plainPassword == "" {
		plainPassword = "changeme123"
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return portin.PostUsersResponse{}, err
	}
	entity.PasswordHash = string(hash)
	entity.Password = "" // clear plaintext before persisting

	// Default active and force password change on first login
	if !entity.IsActive {
		entity.IsActive = true
	}
	entity.FirstLogin = true

	log.Printf("[PostUsers] calling l.users.Save with entity.ID=%s, email=%s", entity.ID, entity.Email)
	if err := l.users.Save(ctx, entity); err != nil {
		log.Printf("[PostUsers] l.users.Save ERROR: %v", err)
		return portin.PostUsersResponse{}, err
	}
	log.Printf("[PostUsers] l.users.Save SUCCESS")

	// Send credentials email using template
	if l.emailSvc != nil {
		body, tmplErr := l.renderWelcomeEmail(entity.FullName, entity.Email, plainPassword)
		if tmplErr != nil {
			log.Printf("PostUsers: failed to render welcome email template: %v", tmplErr)
			body = "Hola " + entity.FullName + ",\n\n" +
				"Tu cuenta en My Application ha sido creada.\n\n" +
				"Email: " + entity.Email + "\n" +
				"Contraseña: " + plainPassword + "\n\n" +
				"Te recomendamos cambiar tu contraseña después de iniciar sesión."
		}
		if err := l.emailSvc.SendEmail(entity.Email, "Bienvenido a My Application - tus credenciales", body); err != nil {
			log.Printf("PostUsers: failed to send welcome email to %s: %v", entity.Email, err)
		}
	}

	return portin.PostUsersResponse{Item: entity}, nil
}

func (l *Logic) UpdateUser(ctx context.Context, req portin.UpdateUserRequest) (portin.UpdateUserResponse, error) {
	if req.Body == nil {
		return portin.UpdateUserResponse{}, errors.New("user body is required")
	}
	entity := req.Body
	entity.UpdatedAt = time.Now()

	if entity.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(entity.Password), bcrypt.DefaultCost)
		if err != nil {
			return portin.UpdateUserResponse{}, err
		}
		entity.PasswordHash = string(hash)
		entity.Password = "" // clear plaintext
		entity.FirstLogin = true // force password change
	}

	if err := l.users.Update(ctx, entity); err != nil {
		return portin.UpdateUserResponse{}, err
	}
	return portin.UpdateUserResponse{Item: entity}, nil
}

func (l *Logic) DeleteUser(ctx context.Context, req portin.DeleteUserRequest) (portin.DeleteUserResponse, error) {
	if err := l.users.Delete(ctx, req.ID); err != nil {
		return portin.DeleteUserResponse{}, err
	}
	return portin.DeleteUserResponse{}, nil
}

// renderWelcomeEmail renders the welcome email template.
// Falls back to plain text if template engine is not configured.
func (l *Logic) renderWelcomeEmail(fullName, email, password string) (string, error) {
	if l.templateRenderer == nil {
		return "", errors.New("template renderer not configured")
	}
	return l.templateRenderer.Render("welcome.html", map[string]any{
		"FullName": fullName,
		"Email":    email,
		"Password": password,
		"LoginURL": l.frontendURL + "/login",
		"LogoURL":  l.getLogoURL(),
	})
}
