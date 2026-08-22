// User-owned: bookings-service proxy routes.
// Called from RegisterUserRoutes (routes_users.go) after user route setup,
// because main_generated.go cannot be edited ("DO NOT EDIT").
package main

import (
	"github.com/labstack/echo/v4"
)

// RegisterBookingsRoutes adds proxy routes for bookings-service.
// Public routes have no AuthMiddleware; internal routes are JWT-gated.
func RegisterBookingsRoutes(e *echo.Echo) {
	// All bookings routes replace /api/bookings → /api on the upstream service.
	to := func(path string) echo.HandlerFunc {
		return proxyHandler("bookings-service", 8083, "/api/bookings", "/api")
	}

	// --- Public routes (NO auth middleware) ---
	// Balneario public profile and availability
	e.GET("/api/bookings/balnearios/:slug", to("/balnearios/:slug"))
	e.GET("/api/bookings/balnearios/:slug/units", to("/balnearios/:slug/units"))
	e.GET("/api/bookings/balnearios/:slug/availability", to("/balnearios/:slug/availability"))
	// Public reservation creation (pending/unpaid)
	e.POST("/api/bookings/balnearios/:slug/reservations", to("/balnearios/:slug/reservations"))

	// --- Protected routes (JWT + RBAC) ---
	// Balneario management
	e.Add("GET", "/api/bookings/balnearios", to("/balnearios"), AuthMiddleware)
	e.Add("POST", "/api/bookings/balnearios", to("/balnearios"), AuthMiddleware)
	e.Add("GET", "/api/bookings/balnearios/:id/plan", to("/balnearios/:id/plan"), AuthMiddleware)

	// Plan unit management
	e.Add("PUT", "/api/bookings/plan-units/:id", to("/plan-units/:id"), AuthMiddleware)

	// Reservation management (internal)
	e.Add("POST", "/api/bookings/reservations", to("/reservations"), AuthMiddleware)
	e.Add("GET", "/api/bookings/reservations", to("/reservations"), AuthMiddleware)
	e.Add("PUT", "/api/bookings/reservations/:id/status", to("/reservations/:id/status"), AuthMiddleware)

	// Customer management
	e.Add("POST", "/api/bookings/customers", to("/customers"), AuthMiddleware)
	e.Add("GET", "/api/bookings/customers", to("/customers"), AuthMiddleware)

	// Tariff management
	e.Add("GET", "/api/bookings/tariffs/:balnearioId", to("/tariffs/:balnearioId"), AuthMiddleware)
	e.Add("POST", "/api/bookings/tariffs", to("/tariffs"), AuthMiddleware)
}
