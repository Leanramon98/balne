package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)


// NeutralClaims holds the tenant-aware identity claims from a neutral JWT.
// Fields match the users-service NeutralClaims definition; UUIDs are stored
// as strings here because the gateway only forwards them as HTTP headers.
type NeutralClaims struct {
	SubjectID      string `json:"sub"`
	SessionID      string `json:"sid"`
	OrganizationID string `json:"org_id"`
	MembershipID   string `json:"mem_id"`
	DeploymentMode string `json:"deployment_mode"`
	jwt.RegisteredClaims
}


var publicPaths = []string{
	"/api/evaluations/health",
	"/api/evaluations/public/",
	"/api/users/auth/login",
	"/api/users/auth/register",
	"/api/users/auth/forgot-password",
	"/api/users/auth/reset-password",
}

func isPublicPath(path string) bool {
	for _, p := range publicPaths {
		if strings.HasPrefix(path, p) {
			return true
		}
	}
	return false
}

func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	secret := []byte(os.Getenv("JWT_SECRET"))
	return func(c echo.Context) error {
		path := c.Request().URL.Path
		c.Logger().Debugf("AuthMiddleware: path=%s isPublic=%v", path, isPublicPath(path))
		if isPublicPath(path) {
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

		// Parse JWT with NeutralClaims
		claims := &NeutralClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return secret, nil
		})
		if err != nil || !token.Valid {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
		}

		if claims.SubjectID == "" {
			return echo.NewHTTPError(http.StatusUnauthorized, "token missing required claims")
		}

		// Forward neutral claims
		c.Set("sub_id", claims.SubjectID)
		c.Set("sid", claims.SessionID)
		c.Set("org_id", claims.OrganizationID)
		c.Set("mem_id", claims.MembershipID)
		c.Set("dep_mode", claims.DeploymentMode)

		c.Request().Header.Set("X-Organization-ID", claims.OrganizationID)
		c.Request().Header.Set("X-Tenant-ID", claims.OrganizationID)
		c.Request().Header.Set("X-Membership-ID", claims.MembershipID)
		c.Request().Header.Set("X-Deployment-Mode", claims.DeploymentMode)

		c.Set("user_id", claims.SubjectID)
		c.Request().Header.Set("X-Authenticated-User", claims.SubjectID)

		// RBAC check
		// TODO: lookup route from c.Path() and validate roles
		// For now, allow all authenticated requests

		return next(c)
	}
}
