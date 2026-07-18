// DEPRECATED: When using the API Gateway, JWT validation happens at the gateway level.
// This middleware is only needed for direct service access (without a gateway).
package httpadapter

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// JWTSecret should be loaded from env in production
var JWTSecret = []byte("change-me-in-production")

// PermissionClaims are the DTI permission claims embedded in the JWT.
type PermissionClaims struct {
	AccessScope             string   `json:"access_scope"`
	CanWriteValues          bool     `json:"can_write_values"`
	CanManageUsers          bool     `json:"can_manage_users"`
	CanApproveGoodPractices bool     `json:"can_approve_good_practices"`
	EvaluationTypes         []string `json:"evaluation_types"`
}

// ExtendedClaims represents the JWT token claims for DTI profiles.
type ExtendedClaims struct {
	UserID        string           `json:"user_id"`
	Email         string           `json:"email"`
	FullName      string           `json:"full_name"`
	Role          string           `json:"role"`
	DestinationID *string          `json:"destination_id,omitempty"`
	Permissions   PermissionClaims `json:"permissions"`
	jwt.RegisteredClaims
}

// NeutralClaims represents the neutral tenant-aware JWT claims for the reusable base.
// These claims carry tenant context without DTI-specific fields.
type NeutralClaims struct {
	SubjectID      string `json:"sub"`
	SessionID      string `json:"sid"`
	OrganizationID string `json:"org_id"`
	MembershipID   string `json:"mem_id"`
	DeploymentMode string `json:"deployment_mode"`
	jwt.RegisteredClaims
}

// LoginClaims is a combined claims struct used during login signing.
// It embeds both neutral and legacy DTI fields for dual-mode backward compatibility.
type LoginClaims struct {
	// Neutral claims
	SubjectID      string `json:"sub,omitempty"`
	SessionID      string `json:"sid,omitempty"`
	OrganizationID string `json:"org_id,omitempty"`
	MembershipID   string `json:"mem_id,omitempty"`
	DeploymentMode string `json:"deployment_mode,omitempty"`

	// Legacy DTI claims
	UserID        string            `json:"user_id,omitempty"`
	Email         string            `json:"email,omitempty"`
	FullName      string            `json:"full_name,omitempty"`
	Role          string            `json:"role,omitempty"`
	DestinationID *string           `json:"destination_id,omitempty"`
	Permissions   *PermissionClaims `json:"permissions,omitempty"`

	jwt.RegisteredClaims
}

// Claims represents the JWT token claims (legacy fallback).
type Claims struct {
	UserID string   `json:"user_id"`
	Roles  []string `json:"roles"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT and injects claims into context
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		path := c.Path()
		if path == "/api/auth/login" || path == "/api/auth/register" || path == "/api/users/auth/login" || path == "/api/users/auth/register" || path == "/api/auth/forgot-password" || path == "/api/auth/reset-password" {
			return next(c)
		}

		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization format")
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JWTSecret, nil
		})

		if err != nil || !token.Valid {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
		}

		c.Set("user_id", claims.UserID)
		c.Set("roles", claims.Roles)
		return next(c)
	}
}

// LoginHandler validates credentials and returns a JWT token
// TODO: replace hardcoded validation with your user repository
func LoginHandler(c echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&req); err != nil {
		c.Logger().Errorf("login bind error: %v (body length: %d)", err, c.Request().ContentLength)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// TODO: validate against your user database
	// For development, any email/password works
	claims := &Claims{
		UserID: "00000000-0000-0000-0000-000000000000",
		Roles:  []string{"admin"},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate token")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"token": tokenString,
	})
}
