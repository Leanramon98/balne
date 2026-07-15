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
// Admin Catalog CRUD: SubnationalLevel
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListSubnationalLevels(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllSubnationalLevels(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "subnational_level", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateSubnationalLevel(c echo.Context) error {
	var entity domain.SubnationalLevel
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateSubnationalLevel(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("subnational_level", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetSubnationalLevel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindSubnationalLevelByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateSubnationalLevel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.SubnationalLevel
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateSubnationalLevel(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("subnational_level", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeleteSubnationalLevel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteSubnationalLevel(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: DestinationTypology
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListDestinationTypologies(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllDestinationTypologies(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "destination_typology", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateDestinationTypology(c echo.Context) error {
	var entity domain.DestinationTypology
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateDestinationTypology(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("destination_typology", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetDestinationTypology(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindDestinationTypologyByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateDestinationTypology(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.DestinationTypology
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateDestinationTypology(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("destination_typology", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeleteDestinationTypology(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteDestinationTypology(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: PopulationRange
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListPopulationRanges(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllPopulationRanges(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "population_range", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreatePopulationRange(c echo.Context) error {
	var entity domain.PopulationRange
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreatePopulationRange(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("population_range", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetPopulationRange(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindPopulationRangeByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdatePopulationRange(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.PopulationRange
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdatePopulationRange(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("population_range", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeletePopulationRange(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeletePopulationRange(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: Region
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListRegions(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllRegions(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "region", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
				if t.Description != nil {
					item.Description = *t.Description
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateRegion(c echo.Context) error {
	var entity domain.Region
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateRegion(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("region", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetRegion(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindRegionByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateRegion(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.Region
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateRegion(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("region", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeleteRegion(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteRegion(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: MemberType
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListMemberTypes(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllMemberTypes(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "member_type", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateMemberType(c echo.Context) error {
	var entity domain.MemberType
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateMemberType(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("member_type", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetMemberType(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindMemberTypeByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateMemberType(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.MemberType
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateMemberType(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("member_type", entity.ID, entity.Name, "", "")
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeleteMemberType(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteMemberType(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: ResponsibleArea
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListResponsibleAreas(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllResponsibleAreas(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "responsible_area", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
				if t.Description != nil {
					item.Description = *t.Description
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateResponsibleArea(c echo.Context) error {
	var entity domain.ResponsibleArea
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateResponsibleArea(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("responsible_area", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetResponsibleArea(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindResponsibleAreaByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateResponsibleArea(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.ResponsibleArea
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateResponsibleArea(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("responsible_area", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeleteResponsibleArea(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteResponsibleArea(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: AxisLevel
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListAxisLevels(c echo.Context) error {
	items, err := l.repo.FindAllAxisLevels(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleCreateAxisLevel(c echo.Context) error {
	var entity domain.AxisLevel
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateAxisLevel(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleGetAxisLevel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	item, err := l.repo.FindAxisLevelByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

func (l *Logic) HandleUpdateAxisLevel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.AxisLevel
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateAxisLevel(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, entity)
}

func (l *Logic) HandleDeleteAxisLevel(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteAxisLevel(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (l *Logic) HandleDeleteScope(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteScope(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (l *Logic) HandleDeleteRequirement(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteRequirement(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (l *Logic) HandleDeleteIndicator(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	if err := l.repo.DeleteIndicator(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Read-only: Scopes, Requirements, Indicators
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListScopes(c echo.Context) error {
	locale := c.QueryParam("locale")
	items, err := l.repo.FindAllScopes(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "scope", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
				if t.Description != nil {
					item.Description = *t.Description
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleListRequirements(c echo.Context) error {
	locale := c.QueryParam("locale")
	scopeID := c.QueryParam("scope_id")
	var items []*domain.Requirement
	var err error
	if scopeID != "" {
		var pid uuid.UUID
		pid, err = uuid.Parse(scopeID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid scope_id")
		}
		items, err = l.repo.FindRequirementsByScope(c.Request().Context(), pid)
	} else {
		items, err = l.repo.FindAllRequirements(c.Request().Context())
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "requirement", item.ID, locale); t != nil {
				if t.Name != nil {
					item.Name = *t.Name
				}
				if t.Description != nil {
					item.Description = *t.Description
				}
			}
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleListIndicators(c echo.Context) error {
	locale := c.QueryParam("locale")
	scopeID := c.QueryParam("scope_id")
	reqID := c.QueryParam("requirement_id")
	var items []*domain.Indicator
	var err error
	if reqID != "" {
		var pid uuid.UUID
		pid, err = uuid.Parse(reqID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid requirement_id")
		}
		items, err = l.repo.FindIndicatorsByRequirement(c.Request().Context(), pid)
	} else if scopeID != "" {
		var pid uuid.UUID
		pid, err = uuid.Parse(scopeID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid scope_id")
		}
		items, err = l.repo.FindIndicatorsByScope(c.Request().Context(), pid)
	} else {
		items, err = l.repo.FindAllIndicators(c.Request().Context())
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "indicator", item.ID, locale)
			l.applyIndicatorTranslation(item, t)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleListIndicatorsByScope(c echo.Context) error {
	locale := c.QueryParam("locale")
	scopeID := c.Param("scopeId")
	pid, err := uuid.Parse(scopeID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid scope id")
	}
	items, err := l.repo.FindIndicatorsByScope(c.Request().Context(), pid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if locale != "" {
		for _, item := range items {
			t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "indicator", item.ID, locale)
			l.applyIndicatorTranslation(item, t)
		}
	}
	return c.JSON(http.StatusOK, items)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: Scope
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleCreateScope(c echo.Context) error {
	var entity domain.Scope
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateScope(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("scope", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleUpdateScope(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.Scope
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateScope(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("scope", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusOK, entity)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: Requirement
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleCreateRequirement(c echo.Context) error {
	var entity domain.Requirement
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = uuid.New()
	if err := l.repo.CreateRequirement(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("requirement", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleUpdateRequirement(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.Requirement
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	if err := l.repo.UpdateRequirement(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	go l.translateCatalogEntityOnWrite("requirement", entity.ID, entity.Name, entity.Description, "")
	return c.JSON(http.StatusOK, entity)
}

// ══════════════════════════════════════════════════════════════════════
// Admin Catalog CRUD: Indicator
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleCreateIndicator(c echo.Context) error {
	var entity domain.Indicator
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	now := time.Now()
	entity.ID = uuid.New()
	entity.CreatedAt = now
	entity.UpdatedAt = now
	if err := l.repo.CreateIndicator(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	criteriaStr := ""
	if len(entity.Criteria) > 0 {
		criteriaStr = string(entity.Criteria)
	}
	go l.translateCatalogEntityOnWrite("indicator", entity.ID, entity.Name, entity.Description, criteriaStr)
	return c.JSON(http.StatusCreated, entity)
}

func (l *Logic) HandleUpdateIndicator(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var entity domain.Indicator
	if err := c.Bind(&entity); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	entity.ID = id
	entity.UpdatedAt = time.Now()
	if err := l.repo.UpdateIndicator(c.Request().Context(), &entity); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	criteriaStr := ""
	if len(entity.Criteria) > 0 {
		criteriaStr = string(entity.Criteria)
	}
	go l.translateCatalogEntityOnWrite("indicator", entity.ID, entity.Name, entity.Description, criteriaStr)
	return c.JSON(http.StatusOK, entity)
}

// applyIndicatorTranslation applies a cached catalog_translation to an indicator,
// skipping fields that would corrupt the original (e.g. criteria whose descriptions
// all came back empty due to a bad DeepL es→es or rate-limit response).
func (l *Logic) applyIndicatorTranslation(ind *domain.Indicator, t *domain.CatalogTranslation) {
	if t == nil {
		return
	}
	if t.Name != nil && *t.Name != "" {
		ind.Name = *t.Name
	}
	if t.Description != nil && *t.Description != "" {
		ind.Description = *t.Description
	}
	if t.Criteria != nil && *t.Criteria != "" && criteriaHasContent(*t.Criteria) {
		ind.Criteria = json.RawMessage(*t.Criteria)
	}
}

// applyIndicatorWithValueTranslation mirrors applyIndicatorTranslation for the
// IndicatorWithValue shape returned by FindIndicatorsByScopeAndEvaluation. Kept
// separate because IndicatorWithValue.Description is *string.
func (l *Logic) applyIndicatorWithValueTranslation(ind *domain.IndicatorWithValue, t *domain.CatalogTranslation) {
	if t == nil {
		return
	}
	if t.Name != nil && *t.Name != "" {
		ind.Name = *t.Name
	}
	if t.Description != nil && *t.Description != "" {
		desc := *t.Description
		ind.Description = &desc
	}
	if t.Criteria != nil && *t.Criteria != "" && criteriaHasContent(*t.Criteria) {
		ind.Criteria = json.RawMessage(*t.Criteria)
	}
}

// criteriaHasContent parses a criteria JSON array and returns true if at least one
// item has a non-empty `description` field. Used to reject translations that would
// wipe the original Spanish descriptions.
func criteriaHasContent(criteriaJSON string) bool {
	var criteria []map[string]interface{}
	if err := json.Unmarshal([]byte(criteriaJSON), &criteria); err != nil {
		return false
	}
	for _, item := range criteria {
		if desc, ok := item["description"].(string); ok && desc != "" {
			return true
		}
	}
	return false
}
