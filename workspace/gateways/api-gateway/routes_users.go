// User-owned: Additional user/auth proxy routes.
// These routes are NOT in the generated schema.yaml endpoints because
// the password recovery endpoints are custom handlers.
// Called from main_generated.go after generated route setup.
package main

import (
	"github.com/labstack/echo/v4"
)

// RegisterUserRoutes adds proxy routes for users-service auth recovery endpoints
// that are public (no AuthMiddleware).
func RegisterUserRoutes(e *echo.Echo) {
	// All user routes replace /api/users → /api on the upstream service
	to := func(path string) echo.HandlerFunc {
		return proxyHandler("users-service", 8081, "/api/users", "/api")
	}

	// Public routes (NO auth middleware) — password recovery
	e.POST("/api/users/auth/forgot-password", to("/auth/forgot-password"))
	e.POST("/api/users/auth/reset-password", to("/auth/reset-password"))

	// Protected routes — change own password (requires JWT)
	e.Add("POST", "/api/users/auth/change-password", to("/auth/change-password"), AuthMiddleware)
	// First-login onboarding — sets the initial password after the user is created
	// with a temporary one. Sets first_login = false on the backend.
	e.Add("POST", "/api/users/auth/complete-onboarding", to("/auth/complete-onboarding"), AuthMiddleware)

	// Session route — returns current session info (user + org + membership).
	// Proxies to users-service which handles the session/me endpoint.
	e.Add("GET", "/api/users/session/me", to("/session/me"), AuthMiddleware)
}
