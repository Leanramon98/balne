// User-owned: Additional evaluation proxy routes.
// These routes are NOT in the generated schema.yaml endpoints because
// the evaluations-service uses custom handlers registered via handlers_register.go.
// Called from main_generated.go after generated route setup.
package main

import (
	"github.com/labstack/echo/v4"
)

// RegisterEvaluationRoutes adds proxy routes for evaluations-service endpoints
// that are defined as custom handlers (not in schema.yaml endpoints).
func RegisterEvaluationRoutes(e *echo.Echo) {
	// All evaluations routes replace /api/evaluations → /api on the upstream service
	to := func(path string) echo.HandlerFunc {
		return proxyHandler("evaluations-service", 8082, "/api/evaluations", "/api")
	}

	// Helper: register route with auth middleware
	auth := func(method, path string) {
		e.Add(method, "/api/evaluations"+path, to(path), AuthMiddleware)
	}

	// Public routes (NO auth middleware)
	e.GET("/api/evaluations/public/good-practices", to("/public/good-practices"))
	e.GET("/api/evaluations/public/good-practices/:id", to("/public/good-practices/:id"))

	// Public catalog endpoints (no auth) — for public Buenas Prácticas page filters
	e.GET("/api/evaluations/health", proxyHandler("evaluations-service", 8082, "/api/evaluations", "")) // NO AuthMiddleware
	e.GET("/api/evaluations/public/scopes", to("/public/scopes"))
	e.GET("/api/evaluations/public/destinations", to("/public/destinations"))
	e.GET("/api/evaluations/public/subnational-levels", to("/public/subnational-levels"))
	e.GET("/api/evaluations/public/typologies", to("/public/typologies"))

	// Destinations
	auth("GET", "/destinations")
	auth("POST", "/destinations")
	auth("GET", "/destinations/:id")
	auth("PUT", "/destinations/:id")
	auth("DELETE", "/destinations/:id")

	// Evaluations CRUD
	auth("GET", "/evaluations")
	auth("POST", "/evaluations")
	auth("GET", "/evaluations/:id")
	auth("PUT", "/evaluations/:id")
	auth("DELETE", "/evaluations/:id")

	// Evaluation state machine & promotion
	auth("POST", "/evaluations/:id/change-status")
	auth("POST", "/evaluations/:id/promote")

	// Evaluation access management
	auth("GET", "/evaluations/:id/users")
	auth("POST", "/evaluations/:id/users")
	auth("DELETE", "/evaluations/:id/users/:userId")

	// Admin scopes/requirements/indicators (read-only catalog views)
	auth("GET", "/admin/scopes")
	auth("GET", "/admin/requirements")
	auth("GET", "/admin/indicators")

	// Admin scopes/requirements/indicators write routes
	auth("POST", "/admin/scopes")
	auth("PUT", "/admin/scopes/:id")
	auth("DELETE", "/admin/scopes/:id")
	auth("POST", "/admin/requirements")
	auth("PUT", "/admin/requirements/:id")
	auth("DELETE", "/admin/requirements/:id")
	auth("POST", "/admin/indicators")
	auth("PUT", "/admin/indicators/:id")
	auth("DELETE", "/admin/indicators/:id")

	// Scope progress
	auth("GET", "/evaluations/:id/scopes")
	auth("GET", "/evaluations/:id/scopes/progress")
	auth("GET", "/evaluations/:evaluationId/scopes/:scopeId/indicators")

	// Indicator values
	auth("GET", "/evaluations/:evaluationId/indicators/:id/value")
	auth("PUT", "/evaluations/:evaluationId/indicators/:id/value")
	auth("PUT", "/evaluations/:evaluationId/indicators/:id/evaluator")
	auth("PUT", "/evaluations/:evaluationId/indicators/:id/ai")
	auth("DELETE", "/evaluations/:evaluationId/indicators/:id/value")
	auth("GET", "/evaluations/:evaluationId/indicators/:id")

	// AI analysis
	auth("POST", "/indicators/:id/analyze")

	// Notifications
	auth("POST", "/evaluations/:id/notify-destination")

	// Indicator messages
	auth("GET", "/indicators/:indicatorValueId/messages")
	auth("POST", "/indicators/:indicatorValueId/messages")

	// Actions
	auth("GET", "/actions")
	auth("POST", "/actions")
	auth("GET", "/actions/:id")
	auth("PUT", "/actions/:id")
	auth("DELETE", "/actions/:id")

	// Action evidence
	auth("POST", "/actions/:id/evidence")
	auth("GET", "/actions/:id/evidence")
	auth("GET", "/evidence/:id")
	auth("DELETE", "/actions/:id/evidence/:evidenceId")

	// Action-indicator linking
	auth("POST", "/actions/:id/link-indicator")
	auth("DELETE", "/actions/:id/unlink-indicator/:indicatorId/:evaluationId")

	// Good Practice
	auth("PUT", "/actions/:id/designate-good-practice")
	auth("PUT", "/actions/:id/approve-good-practice")

	// DTI Plan
	auth("GET", "/dti-plans")
	auth("POST", "/dti-plans")
	auth("GET", "/dti-plans/:id")
	auth("PUT", "/dti-plans/:id")
	auth("DELETE", "/dti-plans/:id")

	// DTI Plan Goals
	auth("POST", "/dti-plans/:id/goals")
	auth("PUT", "/dti-plans/:id/goals/:goalId")
	auth("DELETE", "/dti-plans/:id/goals/:goalId")
	auth("GET", "/dti-plans/:id/goals")

	// Results (filtered query)
	auth("GET", "/results")

	// Informes
	auth("GET", "/informes")
	auth("GET", "/informes/:id")

	// Content Translation Admin
	auth("GET", "/admin/translations/content")
	auth("GET", "/admin/translations/content/:id")
	auth("PUT", "/admin/translations/content/:id")

	// Catalog Translation Admin
	auth("POST", "/admin/translate-all")
	auth("GET", "/admin/translations/catalog")
	auth("PUT", "/admin/translations/catalog/:id")

	// Action Translation Admin
	auth("POST", "/admin/translate-all-actions")
}
