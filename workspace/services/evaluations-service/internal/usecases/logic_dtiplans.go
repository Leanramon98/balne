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
// DtiPlan CRUD
// ══════════════════════════════════════════════════════════════════════

// canWriteDtiPlan checks if the user can create/edit DTI plans.
// GestorDestino+, AdminDestino, and Admin can CRUD.
func canWriteDtiPlan(role string) bool {
	switch role {
	case "admin", "admin_destino", "gestor_destino":
		return true
	default:
		return false
	}
}

func (l *Logic) HandleCreateDtiPlan(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteDtiPlan(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can create DTI plans")
	}

	var req struct {
		DestinationID string `json:"destination_id,omitempty"`
		Name          string `json:"name"`
		StartDate     string `json:"start_date"`
		EndDate       string `json:"end_date"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	// Determine destination
	role = roleFromCtx(c)
	var destID uuid.UUID
	destIDStr := req.DestinationID
	if role != "admin" && destIDStr == "" {
		userDest := destinationIDFromCtx(c)
		if userDest == nil {
			return echo.NewHTTPError(http.StatusBadRequest, "destination_id is required")
		}
		var err error
		destID, err = uuid.Parse(*userDest)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id from user context")
		}
	} else if destIDStr != "" {
		var err error
		destID, err = uuid.Parse(destIDStr)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id")
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "destination_id is required")
	}

	// Non-admin must belong to the destination
	if !permissionEval.IsAdmin(role) {
		if !permissionEval.BelongsToDestination(role, destinationIDFromCtx(c), destID.String()) {
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this destination")
		}
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid start_date, use YYYY-MM-DD")
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid end_date, use YYYY-MM-DD")
	}

	now := time.Now()
	plan := &domain.DtiPlan{
		ID:            uuid.New(),
		DestinationID: destID,
		Name:          req.Name,
		StartDate:     startDate,
		EndDate:       endDate,
		Status:        domain.DtiPlanStatusActivo,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := l.repo.CreateDtiPlan(c.Request().Context(), plan); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, plan)
}

func (l *Logic) HandleListDtiPlans(c echo.Context) error {
	destIDStr := c.QueryParam("destination_id")
	if destIDStr == "" {
		return c.JSON(http.StatusOK, []*domain.DtiPlan{})
	}
	destID, err := uuid.Parse(destIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id")
	}
	items, err := l.repo.FindDtiPlansByDestination(c.Request().Context(), destID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleGetDtiPlan(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	plan, err := l.repo.FindDtiPlanByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "dti plan not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Include goals in the response
	goals, err := l.repo.ListDtiPlanGoals(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Enrich goals with current_score from latest evaluation indicator values
	for _, goal := range goals {
		if goal.CurrentScore == nil {
			iv, err := l.repo.FindLatestIndicatorValueByDestination(c.Request().Context(), plan.DestinationID, goal.IndicatorID)
			if err == nil && iv != nil {
				if iv.DestinationValue != nil {
					goal.CurrentScore = iv.DestinationValue
				} else if iv.EvaluatorValue != nil {
					goal.CurrentScore = iv.EvaluatorValue
				}
			}
		}
	}

	resp := struct {
		*domain.DtiPlan
		Goals []*domain.DtiPlanGoal `json:"goals"`
	}{
		DtiPlan: plan,
		Goals:   goals,
	}

	return c.JSON(http.StatusOK, resp)
}

func (l *Logic) HandleUpdateDtiPlan(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteDtiPlan(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can update DTI plans")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	existing, err := l.repo.FindDtiPlanByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "dti plan not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Non-admin must belong to the destination
	if !permissionEval.IsAdmin(role) {
		if !permissionEval.BelongsToDestination(role, destinationIDFromCtx(c), existing.DestinationID.String()) {
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this plan's destination")
		}
	}

	var req struct {
		Name      *string `json:"name,omitempty"`
		StartDate *string `json:"start_date,omitempty"`
		EndDate   *string `json:"end_date,omitempty"`
		Status    *string `json:"status,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Status validation: if changing to cerrado, allow only if currently activo
	if req.Status != nil {
		switch *req.Status {
		case "cerrado":
			if existing.Status != domain.DtiPlanStatusActivo {
				return echo.NewHTTPError(http.StatusUnprocessableEntity, "only active plans can be closed")
			}
			existing.Status = domain.DtiPlanStatusCerrado
		case "activo":
			if existing.Status == domain.DtiPlanStatusCerrado {
				return echo.NewHTTPError(http.StatusUnprocessableEntity, "a closed plan cannot be reopened")
			}
			existing.Status = domain.DtiPlanStatusActivo
		default:
			return echo.NewHTTPError(http.StatusBadRequest, "invalid status, must be 'activo' or 'cerrado'")
		}
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.StartDate != nil {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			existing.StartDate = t
		}
	}
	if req.EndDate != nil {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			existing.EndDate = t
		}
	}
	existing.UpdatedAt = time.Now()

	if err := l.repo.UpdateDtiPlan(c.Request().Context(), existing); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, existing)
}

func (l *Logic) HandleDeleteDtiPlan(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteDtiPlan(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can delete DTI plans")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	// Check plan exists
	existing, err := l.repo.FindDtiPlanByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "dti plan not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Non-admin must belong to the destination
	if !permissionEval.IsAdmin(role) {
		if !permissionEval.BelongsToDestination(role, destinationIDFromCtx(c), existing.DestinationID.String()) {
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this plan's destination")
		}
	}

	// Can only delete if no goals are linked
	count, err := l.repo.CountDtiPlanGoals(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if count > 0 {
		return echo.NewHTTPError(http.StatusConflict, "cannot delete plan with linked goals, remove goals first")
	}

	if err := l.repo.DeleteDtiPlan(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// DtiPlanGoal Management
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleAddDtiPlanGoal(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteDtiPlan(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can manage DTI plan goals")
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid plan id")
	}

	// Verify plan exists and is active
	plan, err := l.repo.FindDtiPlanByID(c.Request().Context(), planID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "dti plan not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if plan.Status != domain.DtiPlanStatusActivo {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "cannot add goals to a closed plan")
	}

	var req struct {
		IndicatorID string `json:"indicator_id"`
		TargetScore int    `json:"target_score"`
		TargetDate  string `json:"target_date,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.IndicatorID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "indicator_id is required")
	}
	if req.TargetScore < 0 || req.TargetScore > 100 {
		return echo.NewHTTPError(http.StatusBadRequest, "target_score must be between 0 and 100")
	}

	indicatorID, err := uuid.Parse(req.IndicatorID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator_id")
	}

	goal := &domain.DtiPlanGoal{
		ID:          uuid.New(),
		DtiPlanID:   planID,
		IndicatorID: indicatorID,
		TargetScore: req.TargetScore,
	}

	if req.TargetDate != "" {
		t, err := time.Parse("2006-01-02", req.TargetDate)
		if err == nil {
			goal.TargetDate = &t
		}
	}

	if err := l.repo.CreateDtiPlanGoal(c.Request().Context(), goal); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, goal)
}

func (l *Logic) HandleUpdateDtiPlanGoal(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteDtiPlan(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can manage DTI plan goals")
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid plan id")
	}

	goalID, err := uuid.Parse(c.Param("goalId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid goal id")
	}

	// Verify plan exists
	_, err = l.repo.FindDtiPlanByID(c.Request().Context(), planID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "dti plan not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Fetch existing goal
	goal, err := l.repo.FindDtiPlanGoalByID(c.Request().Context(), goalID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "goal not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if goal.DtiPlanID != planID {
		return echo.NewHTTPError(http.StatusBadRequest, "goal does not belong to this plan")
	}

	var req struct {
		TargetScore *int    `json:"target_score,omitempty"`
		TargetDate  *string `json:"target_date,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.TargetScore != nil {
		if *req.TargetScore < 0 || *req.TargetScore > 100 {
			return echo.NewHTTPError(http.StatusBadRequest, "target_score must be between 0 and 100")
		}
		goal.TargetScore = *req.TargetScore
	}
	if req.TargetDate != nil {
		t, err := time.Parse("2006-01-02", *req.TargetDate)
		if err == nil {
			goal.TargetDate = &t
		}
	}

	if err := l.repo.UpdateDtiPlanGoal(c.Request().Context(), goal); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, goal)
}

func (l *Logic) HandleRemoveDtiPlanGoal(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteDtiPlan(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can manage DTI plan goals")
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid plan id")
	}

	goalID, err := uuid.Parse(c.Param("goalId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid goal id")
	}

	// Verify goal exists
	goal, err := l.repo.FindDtiPlanGoalByID(c.Request().Context(), goalID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "goal not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if goal.DtiPlanID != planID {
		return echo.NewHTTPError(http.StatusBadRequest, "goal does not belong to this plan")
	}

	if err := l.repo.DeleteDtiPlanGoal(c.Request().Context(), goalID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (l *Logic) HandleListDtiPlanGoals(c echo.Context) error {
	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid plan id")
	}

	// Get plan for destination_id
	plan, err := l.repo.FindDtiPlanByID(c.Request().Context(), planID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "dti plan not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	goals, err := l.repo.ListDtiPlanGoals(c.Request().Context(), planID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Enrich goals with current_score from latest evaluation indicator values
	for _, goal := range goals {
		if goal.CurrentScore == nil {
			iv, err := l.repo.FindLatestIndicatorValueByDestination(c.Request().Context(), plan.DestinationID, goal.IndicatorID)
			if err == nil && iv != nil {
				if iv.DestinationValue != nil {
					goal.CurrentScore = iv.DestinationValue
				} else if iv.EvaluatorValue != nil {
					goal.CurrentScore = iv.EvaluatorValue
				}
			}
		}
	}

	return c.JSON(http.StatusOK, goals)
}
