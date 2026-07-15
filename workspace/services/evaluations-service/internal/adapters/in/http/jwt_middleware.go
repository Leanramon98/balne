// JWT Middleware for evaluations-service.
// Decodes the extended JWT issued by users-service with DTI claims.
package httpadapter

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// getJWTSecret reads the JWT secret from the environment, falling back to a safe default for development.
func getJWTSecret() []byte {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return []byte(s)
	}
	return []byte("change-me-in-production")
}

// PermissionClaims are the DTI permission claims embedded in the JWT.
type PermissionClaims struct {
	AccessScope             string   `json:"access_scope"`
	CanWriteValues          bool     `json:"can_write_values"`
	CanManageUsers          bool     `json:"can_manage_users"`
	CanApproveGoodPractices bool     `json:"can_approve_good_practices"`
	EvaluationTypes         []string `json:"evaluation_types"`
}

// ExtendedClaims represents the JWT token claims for DTI profiles.
// This matches the claims issued by users-service.
type ExtendedClaims struct {
	UserID        string           `json:"user_id"`
	FullName      string           `json:"full_name"`
	Role          string           `json:"role"`
	DestinationID *string          `json:"destination_id,omitempty"`
	Permissions   PermissionClaims `json:"permissions"`
	jwt.RegisteredClaims
}

// Claims represents the JWT token claims (legacy fallback).
type Claims struct {
	UserID string   `json:"user_id"`
	Roles  []string `json:"roles"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT and injects ExtendedClaims into context.
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization format")
		}

		// Try ExtendedClaims first (new format from users-service)
		claims := &ExtendedClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return getJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			// Fallback to legacy Claims format
			legacyClaims := &Claims{}
			legacyToken, legacyErr := jwt.ParseWithClaims(tokenString, legacyClaims, func(token *jwt.Token) (interface{}, error) {
				return getJWTSecret(), nil
			})
			if legacyErr != nil || !legacyToken.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
			}
			c.Set("user_id", legacyClaims.UserID)
			c.Set("user_name", "") // Legacy claims don't have full_name
			// Extract first role from legacy claims array
			role := ""
			if len(legacyClaims.Roles) > 0 {
				role = legacyClaims.Roles[0]
			}
			c.Set("role", role)
			c.Set("destination_id", nil)
			c.Set("permissions", PermissionClaims{})
			return next(c)
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_name", claims.FullName)
		c.Set("role", claims.Role)
		c.Set("destination_id", claims.DestinationID)
		c.Set("permissions", claims.Permissions)
		return next(c)
	}
}

// LoginHandler validates credentials and returns a JWT token.
// For development only — real auth is handled by users-service.
func LoginHandler(c echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Dev mode: any email/password works
	claims := &ExtendedClaims{
		UserID: "00000000-0000-0000-0000-000000000000",
		Role:   "admin",
		Permissions: PermissionClaims{
			AccessScope: "global",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate token")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"token": tokenString,
	})
}

// GetUserID extracts the user_id from Echo context.
func GetUserID(c echo.Context) string {
	if uid, ok := c.Get("user_id").(string); ok {
		return uid
	}
	return ""
}

// GetRole extracts the role from Echo context.
func GetRole(c echo.Context) string {
	if role, ok := c.Get("role").(string); ok {
		return role
	}
	return ""
}

// GetDestinationID extracts the destination_id from Echo context.
func GetDestinationID(c echo.Context) *string {
	if did, ok := c.Get("destination_id").(*string); ok {
		return did
	}
	return nil
}

// GetPermissions extracts the PermissionClaims from Echo context.
func GetPermissions(c echo.Context) PermissionClaims {
	if perms, ok := c.Get("permissions").(PermissionClaims); ok {
		return perms
	}
	return PermissionClaims{}
}
