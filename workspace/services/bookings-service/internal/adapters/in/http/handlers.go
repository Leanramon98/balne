package httpadapter

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/Leanramon98/balne/workspace/services/bookings-service/internal/domain"
	portin "github.com/Leanramon98/balne/workspace/services/bookings-service/internal/ports/in"
)

// Handler wires the HTTP layer to the use case.
// Auth for internal routes is enforced by the API gateway (JWT middleware);
// this service exposes all routes and relies on the gateway to gate the
// internal subset. Public routes (balneario by slug, units, availability,
// public reservation) are intentionally open.
type Handler struct {
	uc portin.BookingsUseCase
}

// NewHandler creates the HTTP handler and registers all routes on the group.
func NewHandler(e *echo.Group, uc portin.BookingsUseCase) *Handler {
	h := &Handler{uc: uc}
	h.registerRoutes(e)
	return h
}

func (h *Handler) registerRoutes(e *echo.Group) {
	// ---- Public routes (open; surfaced through the gateway without auth) ----
	e.GET("/balnearios/:slug", h.handleGetBalnearioBySlug)
	e.GET("/balnearios/:slug/units", h.handleGetUnits)
	e.GET("/balnearios/:slug/availability", h.handleGetAvailability)
	e.POST("/balnearios/:slug/reservations", h.handleCreatePublicReservation)

	// ---- Internal routes (expect to sit behind gateway JWT auth) ----
	e.GET("/balnearios", h.handleListBalnearios)
	e.POST("/balnearios", h.handleCreateBalneario)
	e.GET("/balnearios/:id/plan", h.handleGetPlan)
	e.PUT("/balnearios/:id/plan", h.handleSavePlan)
	e.PUT("/plan-units/:id", h.handleUpdatePlanUnit)
	e.POST("/reservations", h.handleCreateReservation)
	e.GET("/reservations", h.handleListReservations)
	e.PUT("/reservations/:id/status", h.handleUpdateReservationStatus)
	e.POST("/customers", h.handleCreateCustomer)
	e.GET("/customers", h.handleSearchCustomers)
	e.GET("/tariffs/:balnearioId", h.handleListTariffs)
	e.POST("/tariffs", h.handleCreateTariff)
}

// parseDate accepts RFC3339 or a bare calendar date (YYYY-MM-DD).
func parseDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	return time.Parse("2006-01-02", s)
}

// httpError maps a use case error to an echo HTTP error with a stable status.
func httpError(err error) error {
	if err == nil {
		return nil
	}
	switch {
	case errors.Is(err, domain.ErrBalnearioNotFound) || errors.Is(err, domain.ErrReservationNotFound):
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	case errors.Is(err, domain.ErrReservationConflict):
		return echo.NewHTTPError(http.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrInvalidDateRange) ||
		errors.Is(err, domain.ErrInvalidSlug) ||
		errors.Is(err, domain.ErrInvalidStatus) ||
		errors.Is(err, domain.ErrUnitNotInBalneario) ||
		errors.Is(err, domain.ErrUnitNotRentable) ||
		errors.Is(err, domain.ErrInvalidReservation) ||
		errors.Is(err, domain.ErrPlanUnitNotFound):
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	default:
		if strings.Contains(err.Error(), "is required") || strings.Contains(err.Error(), "must be") {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
}

// ---------------- Public routes ----------------

func (h *Handler) handleGetBalnearioBySlug(c echo.Context) error {
	b, err := h.uc.GetBalnearioBySlug(c.Request().Context(), c.Param("slug"))
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, b)
}

func (h *Handler) handleGetUnits(c echo.Context) error {
	b, err := h.uc.GetBalnearioBySlug(c.Request().Context(), c.Param("slug"))
	if err != nil {
		return httpError(err)
	}
	units, err := h.uc.GetPlan(c.Request().Context(), b.ID)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, units)
}

func (h *Handler) handleGetAvailability(c echo.Context) error {
	start, err := parseDate(c.QueryParam("start"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "start query param (RFC3339 or YYYY-MM-DD) is required")
	}
	end, err := parseDate(c.QueryParam("end"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "end query param (RFC3339 or YYYY-MM-DD) is required")
	}
	units, err := h.uc.GetAvailability(c.Request().Context(), c.Param("slug"), start, end)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, units)
}

// publicReservationRequest is the public booking payload. Customer info is
// provided inline so a guest can book without a pre-existing customer record.
type publicReservationRequest struct {
	UnitID     uuid.UUID `json:"unit_id"`
	StartDate  string    `json:"start_date"`
	EndDate    string    `json:"end_date"`
	GuestCount int       `json:"guest_count"`
	TotalPrice float64   `json:"total_price"`
	Notes      string    `json:"notes"`
	Customer   struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	} `json:"customer"`
}

func (h *Handler) handleCreatePublicReservation(c echo.Context) error {
	var req publicReservationRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	start, err := parseDate(req.StartDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "start_date (RFC3339 or YYYY-MM-DD) is required")
	}
	end, err := parseDate(req.EndDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "end_date (RFC3339 or YYYY-MM-DD) is required")
	}

	b, err := h.uc.GetBalnearioBySlug(c.Request().Context(), c.Param("slug"))
	if err != nil {
		return httpError(err)
	}

	cust, err := h.uc.CreateCustomer(c.Request().Context(), req.Customer.Name, req.Customer.Email, req.Customer.Phone)
	if err != nil {
		return httpError(err)
	}

	res := &domain.Reservation{
		BalnearioID: b.ID,
		UnitID:      req.UnitID,
		CustomerID:  cust.ID,
		StartDate:   start,
		EndDate:     end,
		GuestCount:  req.GuestCount,
		TotalPrice:  req.TotalPrice,
		Notes:       req.Notes,
		CreatedBy:   "public",
	}
	created, err := h.uc.CreateReservation(c.Request().Context(), res)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusCreated, created)
}

// ---------------- Internal routes ----------------

func (h *Handler) handleListBalnearios(c echo.Context) error {
	items, err := h.uc.ListBalnearios(c.Request().Context())
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, items)
}

func (h *Handler) handleCreateBalneario(c echo.Context) error {
	var body struct {
		Name     string `json:"name"`
		Slug     string `json:"slug"`
		Location string `json:"location"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	b, err := h.uc.CreateBalneario(c.Request().Context(), body.Name, body.Slug, body.Location)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusCreated, b)
}

func (h *Handler) handleGetPlan(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid balneario id")
	}
	units, err := h.uc.GetPlan(c.Request().Context(), id)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, units)
}

func (h *Handler) handleSavePlan(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid balneario id")
	}
	var req struct {
		Units []*domain.PlanUnit `json:"units"`
	}
	if err := c.Bind(&req); err != nil {
		// Allow direct array payload or wrapped { "units": [...] }
		var units []*domain.PlanUnit
		if errArray := c.Bind(&units); errArray == nil {
			req.Units = units
		} else {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}
	updated, err := h.uc.SavePlan(c.Request().Context(), id, req.Units)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) handleUpdatePlanUnit(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid plan unit id")
	}
	var u domain.PlanUnit
	if err := c.Bind(&u); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	u.ID = id
	if err := h.uc.UpdatePlanUnit(c.Request().Context(), &u); err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, u)
}

func (h *Handler) handleCreateReservation(c echo.Context) error {
	var res domain.Reservation
	if err := c.Bind(&res); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	// Honor the gateway-injected subject when available.
	if res.CreatedBy == "" {
		if uid, ok := c.Get("user_id").(string); ok && uid != "" {
			res.CreatedBy = uid
		} else {
			res.CreatedBy = "internal"
		}
	}
	created, err := h.uc.CreateReservation(c.Request().Context(), &res)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) handleListReservations(c echo.Context) error {
	var balnearioID *uuid.UUID
	if raw := c.QueryParam("balneario_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid balneario_id")
		}
		balnearioID = &id
	}
	status := c.QueryParam("status")
	items, err := h.uc.ListReservations(c.Request().Context(), balnearioID, status)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, items)
}

func (h *Handler) handleUpdateReservationStatus(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid reservation id")
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := h.uc.UpdateReservationStatus(c.Request().Context(), id, body.Status); err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": body.Status})
}

func (h *Handler) handleCreateCustomer(c echo.Context) error {
	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	cust, err := h.uc.CreateCustomer(c.Request().Context(), body.Name, body.Email, body.Phone)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusCreated, cust)
}

func (h *Handler) handleSearchCustomers(c echo.Context) error {
	items, err := h.uc.SearchCustomers(c.Request().Context(), c.QueryParam("q"))
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, items)
}

func (h *Handler) handleListTariffs(c echo.Context) error {
	id, err := uuid.Parse(c.Param("balnearioId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid balneario id")
	}
	items, err := h.uc.ListTariffs(c.Request().Context(), id)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusOK, items)
}

func (h *Handler) handleCreateTariff(c echo.Context) error {
	var t domain.Tariff
	if err := c.Bind(&t); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	created, err := h.uc.CreateTariff(c.Request().Context(), &t)
	if err != nil {
		return httpError(err)
	}
	return c.JSON(http.StatusCreated, created)
}
