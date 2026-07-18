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

	httpadapter "users-service/internal/adapters/in/http"
	"users-service/internal/domain"
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
			ps = domain.PermissionSet{AccessScope: "destination"}
		}
	}

	// 6. Look up neutral organization/membership for dual-mode
	var orgID, memID *uuid.UUID
	deployMode := l.deploymentMode
	hasNeutral := false

	if l.organizations != nil && l.memberships != nil {
		membership, memErr := l.memberships.FindByPrincipalID(ctx, user.ID)
		if memErr == nil && membership != nil {
			org, orgErr := l.organizations.FindByPrincipalID(ctx, user.ID)
			if orgErr == nil && org != nil {
				orgID = &org.ID
				memID = &membership.ID
				hasNeutral = true
			}
		}
	}

	// 7. Build LoginClaims with combined neutral + legacy DTI fields
	now := time.Now()
	registered := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(now),
	}

	var destIDStr *string
	if user.DestinationID != nil {
		s := user.DestinationID.String()
		destIDStr = &s
	}

	loginClaims := &httpadapter.LoginClaims{
		RegisteredClaims: registered,
		// Legacy DTI fields (always present)
		UserID:        user.ID.String(),
		Email:         user.Email,
		FullName:      user.FullName,
		Role:          role.Name,
		DestinationID: destIDStr,
		Permissions: &httpadapter.PermissionClaims{
			AccessScope:             ps.AccessScope,
			CanWriteValues:          ps.CanWriteValues,
			CanManageUsers:          ps.CanManageUsers,
			CanApproveGoodPractices: ps.CanApproveGoodPractices,
			EvaluationTypes:         ps.EvaluationTypes,
		},
	}

	// Add neutral claims when org/membership exists (dual mode)
	if hasNeutral {
		sessionID := uuid.New()
		loginClaims.SubjectID = user.ID.String()
		loginClaims.SessionID = sessionID.String()
		if orgID != nil {
			loginClaims.OrganizationID = orgID.String()
		}
		if memID != nil {
			loginClaims.MembershipID = memID.String()
		}
		loginClaims.DeploymentMode = deployMode
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, loginClaims)
	tokenString, err := token.SignedString(httpadapter.JWTSecret)
	if err != nil {
		return portin.PostAuthLoginResponse{}, errors.New("failed to generate token")
	}

	// 8. Build LoginResponse with legacy DTI fields + neutral fields
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
			// Neutral tenant fields (dual mode)
			OrganizationID: orgID,
			MembershipID:   memID,
			DeploymentMode: deployMode,
		},
	}

	return resp, nil
}

func (l *Logic) PostAuthRegister(ctx context.Context, req portin.PostAuthRegisterRequest) (portin.PostAuthRegisterResponse, error) {
	panic("PostAuthRegister: not implemented")
}
