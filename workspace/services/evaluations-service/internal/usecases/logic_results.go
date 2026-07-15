package usecases

import (
	"database/sql"
	"net/http"
	"strconv"

	"evaluations-service/internal/domain"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ══════════════════════════════════════════════════════════════════════
// Results
// ══════════════════════════════════════════════════════════════════════

// HandleGetResults returns aggregated evaluation results.
// GET /results
// Query params (all optional): year, scope_id, axis, country,
// typology_id, member_type_id, destination_id.
func (l *Logic) HandleGetResults(c echo.Context) error {
	var filters domain.ResultsFilters

	if yearStr := c.QueryParam("year"); yearStr != "" {
		year, err := strconv.Atoi(yearStr)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid year")
		}
		filters.Year = year
	}
	filters.ScopeID = c.QueryParam("scope_id")
	filters.Axis = c.QueryParam("axis")
	filters.Country = c.QueryParam("country")
	filters.TypologyID = c.QueryParam("typology_id")
	filters.MemberTypeID = c.QueryParam("member_type_id")
	filters.DestinationID = c.QueryParam("destination_id")

	results, err := l.repo.FindResults(c.Request().Context(), filters)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, results)
}

// ══════════════════════════════════════════════════════════════════════
// Informes
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListInformes(c echo.Context) error {
	items, err := l.repo.FindAllReports(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Enhance with destination name for display
	type InformeResponse struct {
		ID              string  `json:"id"`
		EvaluationID    *string `json:"evaluation_id,omitempty"`
		DestinationID   string  `json:"destination_id"`
		DestinationName string  `json:"destination_name"`
		Year            int     `json:"year"`
		Name            string  `json:"name"`
		FileURL         *string `json:"file_url,omitempty"`
		CreatedAt       string  `json:"created_at"`
	}

	result := make([]*InformeResponse, 0)
	for _, item := range items {
		var destName string
		if dest, err := l.repo.FindDestinationByID(c.Request().Context(), item.DestinationID); err == nil {
			destName = dest.Name
		}

		name := item.Name
		if name == "" {
			name = "Red Iberoamericana - " + destName + " - " + formatYear(item.Year)
		}

		resp := &InformeResponse{
			ID:              item.ID.String(),
			DestinationID:   item.DestinationID.String(),
			DestinationName: destName,
			Year:            item.Year,
			Name:            name,
			CreatedAt:       item.CreatedAt.Format("2006-01-02"),
		}
		if item.EvaluationID != nil {
			evalID := item.EvaluationID.String()
			resp.EvaluationID = &evalID
		}
		if item.FileURL != nil {
			resp.FileURL = item.FileURL
		}
		result = append(result, resp)
	}

	return c.JSON(http.StatusOK, result)
}

func (l *Logic) HandleGetInforme(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	item, err := l.repo.FindReportByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "report not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var destName string
	if dest, err := l.repo.FindDestinationByID(c.Request().Context(), item.DestinationID); err == nil {
		destName = dest.Name
	}

	name := item.Name
	if name == "" {
		name = "Red Iberoamericana - " + destName + " - " + formatYear(item.Year)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":               item.ID.String(),
		"evaluation_id":    item.EvaluationID,
		"destination_id":   item.DestinationID.String(),
		"destination_name": destName,
		"year":             item.Year,
		"name":             name,
		"file_url":         item.FileURL,
		"created_at":       item.CreatedAt.Format("2006-01-02"),
	})
}
