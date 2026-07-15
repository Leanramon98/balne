package usecases

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"time"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// Action CRUD
// ══════════════════════════════════════════════════════════════════════

// canWriteAction checks if the user can create/edit actions.
// GestorDestino+, AdminDestino, and Admin can CRUD.
func canWriteAction(role string) bool {
	switch role {
	case "admin", "admin_destino", "gestor_destino":
		return true
	default:
		return false
	}
}

// canDeleteAction checks if the user can delete actions.
// AdminDestino+ and Admin can delete.
func canDeleteAction(role string) bool {
	switch role {
	case "admin", "admin_destino":
		return true
	default:
		return false
	}
}

func (l *Logic) HandleCreateAction(c echo.Context) error {
	role := roleFromCtx(c)
	if !canWriteAction(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can create actions")
	}

	var req struct {
		DestinationID       string           `json:"destination_id"`
		Name                string           `json:"name"`
		Summary             *string          `json:"summary,omitempty"`
		Objective           *string          `json:"objective,omitempty"`
		Status              string           `json:"status,omitempty"`
		Axes                []string         `json:"axes,omitempty"`
		Scopes              []string         `json:"scopes,omitempty"`
		ExtendedDescription *string          `json:"extended_description,omitempty"`
		Complexity          *string          `json:"complexity,omitempty"`
		Horizon             *string          `json:"horizon,omitempty"`
		StartDate           *string          `json:"start_date,omitempty"`
		EndDate             *string          `json:"end_date,omitempty"`
		ResponsiblePerson   *string          `json:"responsible_person,omitempty"`
		ResponsibleAreaID   *string          `json:"responsible_area_id,omitempty"`
		ActorReferences     *string          `json:"actors,omitempty"`
		ODS                 []domain.ODSGoal `json:"ods,omitempty"`
		BudgetAmount        *float64         `json:"budget_amount,omitempty"`
		BudgetCurrency      string           `json:"budget_currency,omitempty"`
		BudgetExecuted      *float64         `json:"budget_executed,omitempty"`
		BudgetSource        *string          `json:"budget_source,omitempty"`
		PhotoURL            *string          `json:"photo_url,omitempty"`
		WebsiteURL          *string          `json:"website_url,omitempty"`
		Awards              *string          `json:"awards,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	// Determine destination from context for non-admin
	role = roleFromCtx(c)
	var destID uuid.UUID
	destIDStr := req.DestinationID
	if role != "admin" && destIDStr == "" {
		// For non-admin, use the user's destination
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
		// Admin with no destID specified
		return echo.NewHTTPError(http.StatusBadRequest, "destination_id is required")
	}

	// Non-admin must belong to the destination
	if !permissionEval.IsAdmin(role) {
		if !permissionEval.BelongsToDestination(role, destinationIDFromCtx(c), destID.String()) {
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this destination")
		}
	}

	status := domain.ActionStatusIdea
	if req.Status != "" {
		status = domain.ActionStatus(req.Status)
		switch status {
		case domain.ActionStatusIdea, domain.ActionStatusEnPlanificacion,
			domain.ActionStatusEnEjecucion, domain.ActionStatusFinalizada,
			domain.ActionStatusDescartada:
			// valid
		default:
			return echo.NewHTTPError(http.StatusBadRequest, "invalid status")
		}
	}

	now := time.Now()
	action := &domain.Action{
		ID:                  uuid.New(),
		DestinationID:       destID,
		Name:                req.Name,
		Summary:             req.Summary,
		Objective:           req.Objective,
		Status:              status,
		BudgetCurrency:      "EUR",
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	// Handle JSON fields
	if len(req.Axes) > 0 {
		axesJSON, _ := json.Marshal(req.Axes)
		action.Axes = axesJSON
	}
	if len(req.Scopes) > 0 {
		scopesJSON, _ := json.Marshal(req.Scopes)
		action.Scopes = scopesJSON
	}
	if len(req.ODS) > 0 {
		odsJSON, _ := json.Marshal(req.ODS)
		action.ODS = odsJSON
	}
	if req.Complexity != nil {
		action.Complexity = req.Complexity
	}
	if req.Horizon != nil {
		action.Horizon = req.Horizon
	}
	if req.StartDate != nil {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			action.StartDate = &t
		}
	}
	if req.EndDate != nil {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			action.EndDate = &t
		}
	}
	if req.ResponsiblePerson != nil {
		action.ResponsiblePerson = req.ResponsiblePerson
	}
	if req.ResponsibleAreaID != nil {
		pid, err := uuid.Parse(*req.ResponsibleAreaID)
		if err == nil {
			action.ResponsibleAreaID = &pid
		}
	}
	if req.ActorReferences != nil {
		action.ActorReferences = req.ActorReferences
	}
	if req.BudgetAmount != nil {
		action.BudgetAmount = req.BudgetAmount
	}
	if req.BudgetCurrency != "" {
		action.BudgetCurrency = req.BudgetCurrency
	}
	if req.BudgetExecuted != nil {
		action.BudgetExecuted = req.BudgetExecuted
	}
	if req.BudgetSource != nil {
		action.BudgetSource = req.BudgetSource
	}
	if req.PhotoURL != nil {
		action.PhotoURL = req.PhotoURL
	}
	if req.WebsiteURL != nil {
		action.WebsiteURL = req.WebsiteURL
	}
	if req.Awards != nil {
		action.Awards = req.Awards
	}
	if req.ExtendedDescription != nil {
		action.ExtendedDescription = req.ExtendedDescription
	}

	if err := l.repo.CreateAction(c.Request().Context(), action); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, action)
}

func (l *Logic) HandleListActions(c echo.Context) error {
	if scopeIDStr := c.QueryParam("scope_id"); scopeIDStr != "" {
		scopeID, err := uuid.Parse(scopeIDStr)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid scope_id")
		}
		actions, err := l.repo.FindActionsByScope(c.Request().Context(), scopeID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, actions)
	}
	destIDStr := c.QueryParam("destination_id")
	if destIDStr == "" {
		items, err := l.repo.FindAllActions(c.Request().Context())
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, items)
	}
	destID, err := uuid.Parse(destIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id")
	}
	items, err := l.repo.FindActionsByDestination(c.Request().Context(), destID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleGetAction(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	action, err := l.repo.FindActionByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "action not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Attach good_practice if one exists for this action
	gp, err := l.repo.FindGoodPracticeByActionID(c.Request().Context(), action.ID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		// Log but don't fail — good_practice is optional
		c.Logger().Warnf("failed to fetch good_practice for action %s: %v", action.ID, err)
	}
	if gp != nil {
		action.GoodPractice = gp
	}

	return c.JSON(http.StatusOK, action)
}

func (l *Logic) HandleUpdateAction(c echo.Context) error {
	log.Printf("[HandleUpdateAction] START id=%s role=%s", c.Param("id"), roleFromCtx(c))

	role := roleFromCtx(c)
	if !canWriteAction(role) {
		log.Printf("[HandleUpdateAction] ERROR forbidden role=%s", role)
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can update actions")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("[HandleUpdateAction] ERROR parsing id: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	existing, err := l.repo.FindActionByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[HandleUpdateAction] ERROR action not found")
			return echo.NewHTTPError(http.StatusNotFound, "action not found")
		}
		log.Printf("[HandleUpdateAction] ERROR fetching action: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[HandleUpdateAction] found action name=%s destination=%s", existing.Name, existing.DestinationID)

	// Non-admin must belong to the destination
	if !permissionEval.IsAdmin(role) {
		if !permissionEval.BelongsToDestination(role, destinationIDFromCtx(c), existing.DestinationID.String()) {
			log.Printf("[HandleUpdateAction] ERROR user does not belong to destination")
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this action's destination")
		}
	}

	var req struct {
		Name                *string          `json:"name,omitempty"`
		Summary             *string          `json:"summary,omitempty"`
		Objective           *string          `json:"objective,omitempty"`
		Status              *string          `json:"status,omitempty"`
		Axes                []string         `json:"axes,omitempty"`
		Scopes              []string         `json:"scopes,omitempty"`
		ExtendedDescription *string          `json:"extended_description,omitempty"`
		Complexity          *string          `json:"complexity,omitempty"`
		Horizon             *string          `json:"horizon,omitempty"`
		StartDate           *string          `json:"start_date,omitempty"`
		EndDate             *string          `json:"end_date,omitempty"`
		ResponsiblePerson   *string          `json:"responsible_person,omitempty"`
		ResponsibleAreaID   *string          `json:"responsible_area_id,omitempty"`
		ActorReferences     *string          `json:"actors,omitempty"`
		ODS                 []domain.ODSGoal `json:"ods,omitempty"`
		BudgetAmount        *float64         `json:"budget_amount,omitempty"`
		BudgetCurrency      *string          `json:"budget_currency,omitempty"`
		BudgetExecuted      *float64         `json:"budget_executed,omitempty"`
		BudgetSource        *string          `json:"budget_source,omitempty"`
		PhotoURL            *string          `json:"photo_url,omitempty"`
		WebsiteURL          *string          `json:"website_url,omitempty"`
		Awards              *string          `json:"awards,omitempty"`
	}
	// Read raw body for debugging before Echo's binder consumes it
	bodyBytes, readErr := io.ReadAll(c.Request().Body)
	if readErr == nil {
		c.Request().Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		log.Printf("[HandleUpdateAction] raw body (%d bytes): %s", len(bodyBytes), string(bodyBytes))
	}
	if err := c.Bind(&req); err != nil {
		log.Printf("[HandleUpdateAction] ERROR binding request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	statusStr := ""
	if req.Status != nil {
		statusStr = *req.Status
	}
	nameStr := ""
	if req.Name != nil {
		nameStr = *req.Name
	}
	log.Printf("[HandleUpdateAction] request parsed: name=%q status=%q axes=%v scopes=%v",
		nameStr, statusStr, req.Axes, req.Scopes)

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Summary != nil {
		existing.Summary = req.Summary
	}
	if req.Objective != nil {
		existing.Objective = req.Objective
	}
	if req.Status != nil {
		s := domain.ActionStatus(*req.Status)
		switch s {
		case domain.ActionStatusIdea, domain.ActionStatusEnPlanificacion,
			domain.ActionStatusEnEjecucion, domain.ActionStatusFinalizada,
			domain.ActionStatusDescartada:
			existing.Status = s
		default:
			return echo.NewHTTPError(http.StatusBadRequest, "invalid status")
		}
	}
	if req.Axes != nil {
		axesJSON, _ := json.Marshal(req.Axes)
		existing.Axes = axesJSON
	}
	if req.Scopes != nil {
		scopesJSON, _ := json.Marshal(req.Scopes)
		existing.Scopes = scopesJSON
	}
	if req.ExtendedDescription != nil {
		existing.ExtendedDescription = req.ExtendedDescription
	}
	if req.Complexity != nil {
		existing.Complexity = req.Complexity
	}
	if req.Horizon != nil {
		existing.Horizon = req.Horizon
	}
	if req.StartDate != nil {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			existing.StartDate = &t
		}
	}
	if req.EndDate != nil {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			existing.EndDate = &t
		}
	}
	if req.ResponsiblePerson != nil {
		existing.ResponsiblePerson = req.ResponsiblePerson
	}
	if req.ResponsibleAreaID != nil {
		pid, err := uuid.Parse(*req.ResponsibleAreaID)
		if err == nil {
			existing.ResponsibleAreaID = &pid
		}
	}
	if req.ActorReferences != nil {
		existing.ActorReferences = req.ActorReferences
	}
	if req.ODS != nil {
		odsJSON, _ := json.Marshal(req.ODS)
		existing.ODS = odsJSON
	}
	if req.BudgetAmount != nil {
		existing.BudgetAmount = req.BudgetAmount
	}
	if req.BudgetCurrency != nil {
		existing.BudgetCurrency = *req.BudgetCurrency
	}
	if req.BudgetExecuted != nil {
		existing.BudgetExecuted = req.BudgetExecuted
	}
	if req.BudgetSource != nil {
		existing.BudgetSource = req.BudgetSource
	}
	if req.PhotoURL != nil {
		existing.PhotoURL = req.PhotoURL
	}
	if req.WebsiteURL != nil {
		existing.WebsiteURL = req.WebsiteURL
	}
	if req.Awards != nil {
		existing.Awards = req.Awards
	}
	existing.UpdatedAt = time.Now()

	log.Printf("[HandleUpdateAction] about to call UpdateAction name=%s status=%s", existing.Name, existing.Status)
	log.Printf("[HandleUpdateAction] responsible_area_id=%v budget_currency=%s", existing.ResponsibleAreaID, existing.BudgetCurrency)
	if err := l.repo.UpdateAction(c.Request().Context(), existing); err != nil {
		log.Printf("[HandleUpdateAction] ERROR updating action: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[HandleUpdateAction] SUCCESS")
	return c.JSON(http.StatusOK, existing)
}

func (l *Logic) HandleDeleteAction(c echo.Context) error {
	role := roleFromCtx(c)
	if !canDeleteAction(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only admin_destino or admin can delete actions")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	existing, err := l.repo.FindActionByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "action not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Non-admin must belong to the destination
	if !permissionEval.IsAdmin(role) {
		if !permissionEval.BelongsToDestination(role, destinationIDFromCtx(c), existing.DestinationID.String()) {
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this action's destination")
		}
	}

	if err := l.repo.DeleteAction(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// ActionEvidence
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleAddActionEvidence(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action id")
	}

	// Verify action exists
	_, err = l.repo.FindActionByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "action not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var req struct {
		EvaluationID string  `json:"evaluation_id"`
		Type         string  `json:"type"`
		URL          *string `json:"url,omitempty"`
		FilePath     *string `json:"file_path,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.EvaluationID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "evaluation_id is required")
	}
	if req.Type == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "type is required")
	}
	evalID, err := uuid.Parse(req.EvaluationID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation_id")
	}

	evType := domain.EvidenceType(req.Type)
	switch evType {
	case domain.EvidenceTypeDocument, domain.EvidenceTypeURL,
		domain.EvidenceTypeAudiovisual, domain.EvidenceTypePress:
		// valid
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evidence type")
	}

	now := time.Now()
	evidence := &domain.ActionEvidence{
		ID:           uuid.New(),
		ActionID:     id,
		EvaluationID: evalID,
		Type:         evType,
		URL:          req.URL,
		FilePath:     req.FilePath,
		CreatedAt:    now,
	}

	if err := l.repo.CreateActionEvidence(c.Request().Context(), evidence); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, evidence)
}

func (l *Logic) HandleListActionEvidence(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action id")
	}

	items, err := l.repo.ListActionEvidence(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

func (l *Logic) HandleGetActionEvidence(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evidence id")
	}

	evidence, err := l.repo.FindActionEvidenceByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evidence not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Access check: the caller must have access to the evaluation that owns this evidence
	role := roleFromCtx(c)
	if !permissionEval.IsAdmin(role) {
		userLevel, err := l.getUserAccessLevel(c, evidence.EvaluationID)
		if err != nil {
			return err // already an HTTPError
		}
		// Empty level means no access at all — deny immediately
		// (HasEvaluationAccess cannot detect this because accessLevelOrder[""] returns 0,
		//  which is >= SoloLectura (0), incorrectly allowing access)
		if userLevel == "" || !permissionEval.HasEvaluationAccess(role, userLevel, domain.AccessLevelSoloLectura) {
			return echo.NewHTTPError(http.StatusForbidden, "no access to this evidence")
		}
	}

	return c.JSON(http.StatusOK, evidence)
}

func (l *Logic) HandleDeleteActionEvidence(c echo.Context) error {
	id, err := uuid.Parse(c.Param("evidenceId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evidence id")
	}

	// Verify evidence exists
	_, err = l.repo.FindActionEvidenceByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evidence not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := l.repo.DeleteActionEvidence(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// ActionIndicatorLink
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleLinkIndicator(c echo.Context) error {
	actionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action id")
	}

	// Verify action exists
	action, err := l.repo.FindActionByID(c.Request().Context(), actionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "action not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var req struct {
		IndicatorID  string `json:"indicator_id"`
		EvaluationID string `json:"evaluation_id"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.IndicatorID == "" || req.EvaluationID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "indicator_id and evaluation_id are required")
	}

	indicatorID, err := uuid.Parse(req.IndicatorID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator_id")
	}
	evalID, err := uuid.Parse(req.EvaluationID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation_id")
	}

	link := &domain.ActionIndicatorLink{
		ID:                 uuid.New(),
		ActionID:           actionID,
		IndicatorID:        indicatorID,
		EvaluationID:       evalID,
		ActionStatusAtLink: action.Status,
		CreatedAt:          time.Now(),
	}

	if err := l.repo.CreateActionIndicatorLink(c.Request().Context(), link); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, link)
}

func (l *Logic) HandleUnlinkIndicator(c echo.Context) error {
	actionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action id")
	}
	indicatorID, err := uuid.Parse(c.Param("indicatorId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator id")
	}
	evalIDStr := c.Param("evaluationId")
	if evalIDStr == "" {
		evalIDStr = c.QueryParam("evaluation_id")
	}
	var evalID uuid.UUID
	if evalIDStr != "" {
		evalID, err = uuid.Parse(evalIDStr)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
		}
	}

	if err := l.repo.DeleteActionIndicatorLink(c.Request().Context(), actionID, indicatorID, evalID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// Notification
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleNotifyDestination(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	// Only admin roles can send notifications (admin_global or admin_destino)
	role := roleFromCtx(c)
	if !permissionEval.IsAdmin(role) && role != "admin_destino" {
		return echo.NewHTTPError(http.StatusForbidden, "only admin can send notifications to destination")
	}

	// Verify evaluation exists
	_, err = l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Log the action (stub — no real email dispatch)
	_ = userIDFromCtx(c)

	return c.JSON(http.StatusOK, map[string]string{"message": "notificación enviada"})
}
