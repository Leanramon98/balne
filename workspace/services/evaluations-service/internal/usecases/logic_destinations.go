package usecases

import (
	"database/sql"
	"net/http"
	"time"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// Destinations CRUD
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListDestinations(c echo.Context) error {
	items, err := l.repo.FindDestinations(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateDestination(c echo.Context) error {
	var entity domain.Destination
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	entity.CreatedAt = time.Now()
	entity.UpdatedAt = time.Now()
	if err := l.repo.CreateDestination(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetDestination(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindDestinationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateDestination(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var req domain.Destination
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	existing, err := l.repo.FindDestinationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	existing.Name = req.Name
	existing.Country = req.Country
	existing.SubnationalLevelID = req.SubnationalLevelID
	existing.TypologyID = req.TypologyID
	existing.PopulationRangeID = req.PopulationRangeID
	existing.RegionID = req.RegionID
	existing.MemberTypeID = req.MemberTypeID
	existing.Lat = req.Lat
	existing.Lng = req.Lng
	existing.IsAdhered = req.IsAdhered
	existing.UpdatedAt = time.Now()

	if err := l.repo.UpdateDestination(c.Request().Context(), existing); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, existing)
}

func (l *Logic) HandleDeleteDestination(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteDestination(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
