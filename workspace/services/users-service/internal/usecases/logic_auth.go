package usecases

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"users-service/internal/domain"
	httpadapter "users-service/internal/adapters/in/http"
	portin "users-service/internal/ports/in"
)

func (l *Logic) PostAuthLogin(ctx context.Context, req portin.PostAuthLoginRequest) (portin.PostAuthLoginResponse, error) {
	if req.Body == nil {
		return portin.PostAuthLoginResponse{}, ErrInvalidCredentials
	}

	// 1. Find user by email
	user, err := l.users.FindByEmail(ctx, req.Body.Email)
	if err != nil {
		return portin.PostAuthLoginResponse{}, err
	}
	if user == nil {
		return portin.PostAuthLoginResponse{}, ErrInvalidCredentials
	}

	// 2. Verify password
	log.Printf("Comparing hash: %s with password: %s", user.PasswordHash, req.Body.Password)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Body.Password)); err != nil {
		return portin.PostAuthLoginResponse{}, ErrInvalidCredentials
	}

	// 3. Check if user is active
	if !user.IsActive {
		return portin.PostAuthLoginResponse{}, ErrUserInactive
	}

	// 4. Load role and permissions
	role, err := l.roles.FindByID(ctx, user.RoleID.String())
	if err != nil {
		return portin.PostAuthLoginResponse{}, err
	}
	if role == nil {
		return portin.PostAuthLoginResponse{}, ErrRoleNotFound
	}

	// 5. Parse permissions JSON into PermissionSet
	ps := domain.PermissionSet{
		AccessScope: "destination", // default
	}
	if len(role.Permissions) > 0 {
		if err := json.Unmarshal(role.Permissions, &ps); err != nil {
			// If permissions are invalid, use defaults
			ps = domain.PermissionSet{AccessScope: "destination"}
		}
	}

	// 6. Build extended JWT claims
	var destIDStr *string
	if user.DestinationID != nil {
		s := user.DestinationID.String()
		destIDStr = &s
	}

	claims := &httpadapter.ExtendedClaims{
		UserID:   user.ID.String(),
		Email:    user.Email,
		FullName: user.FullName,
		Role:     role.Name,
		DestinationID: destIDStr,
		Permissions: httpadapter.PermissionClaims{
			AccessScope:             ps.AccessScope,
			CanWriteValues:          ps.CanWriteValues,
			CanManageUsers:          ps.CanManageUsers,
			CanApproveGoodPractices: ps.CanApproveGoodPractices,
			EvaluationTypes:         ps.EvaluationTypes,
		},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(httpadapter.JWTSecret)
	if err != nil {
		return portin.PostAuthLoginResponse{}, errors.New("failed to generate token")
	}

	// 7. Build LoginResponse with extended fields
	var destID *uuid.UUID
	if user.DestinationID != nil {
		destID = user.DestinationID
	}

	resp := portin.PostAuthLoginResponse{
		Item: &domain.LoginResponse{
			Token:         tokenString,
			User:          user.ID,
			Role:          role.Name,
			DestinationID: destID,
			Permissions:   ps,
			FirstLogin:    user.FirstLogin,
		},
	}

	return resp, nil
}

func (l *Logic) PostAuthRegister(ctx context.Context, req portin.PostAuthRegisterRequest) (portin.PostAuthRegisterResponse, error) {
	panic("PostAuthRegister: not implemented")
}
