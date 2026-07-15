package usecases

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// Content Translation Admin
// ══════════════════════════════════════════════════════════════════════

// HandleListContentTranslations returns action translations with optional filters.
// Query params: ?locale=pt&reviewed=false
func (l *Logic) HandleListContentTranslations(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	locale := c.QueryParam("locale")
	var reviewed *bool
	if v := c.QueryParam("reviewed"); v != "" {
		b := v == "true"
		reviewed = &b
	}

	items, err := l.repo.ListPendingTranslations(c.Request().Context(), locale, reviewed)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Enrich with action and destination names, plus original Spanish source text
	type EnrichedTranslation struct {
		*domain.ActionTranslation
		ActionName           string  `json:"action_name"`
		ActionDestinationID  string  `json:"action_destination_id"`
		SourceName           string  `json:"source_name"`
		SourceSummary        *string `json:"source_summary"`
		SourceDescription    *string `json:"source_description"`
	}
	result := make([]EnrichedTranslation, 0, len(items))
	for _, t := range items {
		action, err := l.repo.FindActionByID(c.Request().Context(), t.ActionID)
		if err != nil {
			continue
		}
		srcSummary := action.Summary
		srcDesc := action.ExtendedDescription
		result = append(result, EnrichedTranslation{
			ActionTranslation:   t,
			ActionName:          action.Name,
			ActionDestinationID: action.DestinationID.String(),
			SourceName:          action.Name,
			SourceSummary:       srcSummary,
			SourceDescription:   srcDesc,
		})
	}

	return c.JSON(http.StatusOK, result)
}

// HandleGetContentTranslation returns a single action translation by ID.
func (l *Logic) HandleGetContentTranslation(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid translation id")
	}

	// List all and find by ID (simplified approach)
	items, err := l.repo.ListPendingTranslations(c.Request().Context(), "", nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	for _, t := range items {
		if t.ID == id {
			return c.JSON(http.StatusOK, t)
		}
	}

	return echo.NewHTTPError(http.StatusNotFound, "translation not found")
}

// HandleReviewContentTranslation updates a translation's fields and marks it as reviewed.
func (l *Logic) HandleReviewContentTranslation(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid translation id")
	}

	// Find the translation first (we need to scan all since we don't have GetByID)
	items, err := l.repo.ListPendingTranslations(c.Request().Context(), "", nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var translation *domain.ActionTranslation
	for _, t := range items {
		if t.ID == id {
			translation = t
			break
		}
	}
	if translation == nil {
		return echo.NewHTTPError(http.StatusNotFound, "translation not found")
	}

	var req struct {
		Name        *string          `json:"name"`
		Summary     *string          `json:"summary"`
		Description *string          `json:"description"`
		ODS         *json.RawMessage `json:"ods"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Apply edits
	if req.Name != nil {
		translation.Name = *req.Name
	}
	if req.Summary != nil {
		translation.Summary = req.Summary
	}
	if req.Description != nil {
		translation.Description = req.Description
	}
	if req.ODS != nil {
		translation.ODS = *req.ODS
	}

	// Mark as reviewed
	userID, _ := uuid.Parse(userIDFromCtx(c))
	now := time.Now()
	translation.TranslationReviewed = true
	translation.ReviewedBy = &userID
	translation.ReviewedAt = &now

	if err := l.repo.UpdateTranslation(c.Request().Context(), translation); err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "translation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, translation)
}
