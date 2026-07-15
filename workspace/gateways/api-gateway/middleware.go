package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type Claims struct {
	UserID string   `json:"user_id"`
	Roles  []string `json:"roles"`
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

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return secret, nil
		})
		if err != nil || !token.Valid {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
		}

		// Store for downstream
		c.Set("user_id", claims.UserID)
		c.Set("roles", claims.Roles)

		// Forward auth info to service
		c.Request().Header.Set("X-Authenticated-User", claims.UserID)
		c.Request().Header.Set("X-Authenticated-Roles", strings.Join(claims.Roles, ","))

		// RBAC check
		// TODO: lookup route from c.Path() and validate roles
		// For now, allow all authenticated requests

		return next(c)
	}
}
