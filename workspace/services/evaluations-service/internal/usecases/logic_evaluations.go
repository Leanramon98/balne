package usecases

import (
	"context"
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// Evaluation CRUD
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListEvaluations(c echo.Context) error {
	role := roleFromCtx(c)
	evalType := c.QueryParam("type")
	status := c.QueryParam("status")
	limit, offset := parsePagination(c)
	ctx := c.Request().Context()

	switch role {
	case "admin", "gestor_nacional":
		destID := c.QueryParam("destination_id")
		items, err := l.repo.FindEvaluations(ctx, destID, evalType, status, limit, offset)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		total, err := l.repo.CountEvaluations(ctx, destID, evalType, status)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, PaginatedEvaluationsResponse{
			Data:   items,
			Total:  total,
			Limit:  limit,
			Offset: offset,
		})

	case "admin_destino", "gestor_destino":
		userDestID := destinationIDFromCtx(c)
		if userDestID == nil || *userDestID == "" {
			return c.JSON(http.StatusOK, emptyPaginatedResponse(limit, offset))
		}
		items, err := l.repo.FindEvaluations(ctx, *userDestID, evalType, status, limit, offset)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		total, err := l.repo.CountEvaluations(ctx, *userDestID, evalType, status)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, PaginatedEvaluationsResponse{
			Data:   items,
			Total:  total,
			Limit:  limit,
			Offset: offset,
		})

	case "gestor_regional":
		userDestID := destinationIDFromCtx(c)
		if userDestID == nil || *userDestID == "" {
			return c.JSON(http.StatusOK, emptyPaginatedResponse(limit, offset))
		}
		destUUID, err := uuid.Parse(*userDestID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id in token")
		}
		dest, err := l.repo.FindDestinationByID(ctx, destUUID)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.JSON(http.StatusOK, emptyPaginatedResponse(limit, offset))
			}
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		if dest.RegionID == nil {
			return c.JSON(http.StatusOK, emptyPaginatedResponse(limit, offset))
		}
		regionDests, err := l.repo.FindDestinationsByRegionID(ctx, dest.RegionID.String())
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		destIDs := make([]uuid.UUID, len(regionDests))
		for i, d := range regionDests {
			destIDs[i] = d.ID
		}
		items, total, err := l.repo.FindEvaluationsByDestinationIDs(ctx, destIDs, evalType, status, limit, offset)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, PaginatedEvaluationsResponse{
			Data:   items,
			Total:  total,
			Limit:  limit,
			Offset: offset,
		})

	case "consultor":
		userID := userIDFromCtx(c)
		items, total, err := l.repo.FindEvaluationsByUserID(ctx, userID, []string{"autodiagnostico", "diagnostico"}, status, limit, offset)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, PaginatedEvaluationsResponse{
			Data:   items,
			Total:  total,
			Limit:  limit,
			Offset: offset,
		})

	case "auditor":
		userID := userIDFromCtx(c)
		items, total, err := l.repo.FindEvaluationsByUserID(ctx, userID, []string{"auditoria"}, status, limit, offset)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, PaginatedEvaluationsResponse{
			Data:   items,
			Total:  total,
			Limit:  limit,
			Offset: offset,
		})

	default:
		return c.JSON(http.StatusOK, emptyPaginatedResponse(limit, offset))
	}
}

func (l *Logic) HandleCreateEvaluation(c echo.Context) error {
	role := roleFromCtx(c)
	if !permissionEval.IsAdmin(role) && role != "admin_destino" && role != "gestor_destino" {
		return echo.NewHTTPError(http.StatusForbidden, "only admin, admin_destino, or gestor_destino can create evaluations")
	}

	var req struct {
		DestinationID        string  `json:"destination_id"`
		Name                 string  `json:"name"`
		Type                 string  `json:"type"`
		StartDate            *string `json:"start_date,omitempty"`
		EndDate              *string `json:"end_date,omitempty"`
		HasExternalEvaluator bool    `json:"has_external_evaluator"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	if req.Type == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "type is required")
	}

	evalType := domain.EvaluationType(req.Type)
	switch evalType {
	case domain.EvaluationTypeAutodiagnostico, domain.EvaluationTypeDiagnostico,
		domain.EvaluationTypeAuditoria, domain.EvaluationTypeMedicionEspontanea:
		// valid
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation type")
	}

	destID, err := uuid.Parse(req.DestinationID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id")
	}

	// B02: Validate type creation rules (prerequisite evaluation must exist)
	switch evalType {
	case domain.EvaluationTypeAutodiagnostico, domain.EvaluationTypeMedicionEspontanea:
		// always allowed — no check needed
	case domain.EvaluationTypeDiagnostico:
		existing, err := l.repo.FindEvaluations(c.Request().Context(), destID.String(), "autodiagnostico", "cerrada", 1, 0)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		if len(existing) == 0 {
			return echo.NewHTTPError(http.StatusUnprocessableEntity, "promotion_required.autodiagnostico")
		}
	case domain.EvaluationTypeAuditoria:
		existing, err := l.repo.FindEvaluations(c.Request().Context(), destID.String(), "diagnostico", "cerrada", 1, 0)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		if len(existing) == 0 {
			return echo.NewHTTPError(http.StatusUnprocessableEntity, "promotion_required.diagnostico")
		}
	}

	// admin_destino must belong to the destination
	if !permissionEval.IsAdmin(role) {
		userDestID := destinationIDFromCtx(c)
		if !permissionEval.BelongsToDestination(role, userDestID, req.DestinationID) {
			return echo.NewHTTPError(http.StatusForbidden, "you do not belong to this destination")
		}
	}

	userIDStr := userIDFromCtx(c)
	createdBy, _ := uuid.Parse(userIDStr)

	now := time.Now()
	eval := &domain.Evaluation{
		ID:                   uuid.New(),
		DestinationID:        destID,
		Name:                 req.Name,
		Type:                 evalType,
		Status:               domain.EvaluationStatusBorrador,
		HasExternalEvaluator: req.HasExternalEvaluator,
		CreatedBy:            createdBy,
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	if req.StartDate != nil {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			eval.StartDate = &t
		}
	}
	if req.EndDate != nil {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			eval.EndDate = &t
		}
	}

	if err := l.repo.CreateEvaluation(c.Request().Context(), eval); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Auto-grant administracion level to the creator (admin_destino or other non-admin)
	if !permissionEval.IsAdmin(role) {
		_ = l.repo.GrantAccess(c.Request().Context(), eval.ID, createdBy, domain.AccessLevelAdministracion)
	}

	return c.JSON(http.StatusCreated, eval)
}

func (l *Logic) HandleGetEvaluation(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	eval, err := l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Check access based on role.
	// Non-admin users get access via:
	//   - admin_destino / gestor_destino: same destination as the evaluation
	//   - gestor_regional: destination belongs to user's region
	//   - other roles: explicit grant in evaluation_user
	role := roleFromCtx(c)
	if !permissionEval.IsAdmin(role) {
		userDestID := destinationIDFromCtx(c)

		switch role {
		case "admin_destino", "gestor_destino":
			if !permissionEval.BelongsToDestination(role, userDestID, eval.DestinationID.String()) {
				return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
			}

		case "gestor_regional":
			if userDestID == nil || *userDestID == "" {
				return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
			}
			destUUID, parseErr := uuid.Parse(*userDestID)
			if parseErr != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "invalid destination_id in token")
			}
			dest, findErr := l.repo.FindDestinationByID(c.Request().Context(), destUUID)
			if findErr != nil {
				if findErr == sql.ErrNoRows {
					return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
				}
				return echo.NewHTTPError(http.StatusInternalServerError, findErr.Error())
			}
			if dest.RegionID == nil {
				return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
			}
			regionDests, findErr := l.repo.FindDestinationsByRegionID(c.Request().Context(), dest.RegionID.String())
			if findErr != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, findErr.Error())
			}
			hasAccess := false
			for _, d := range regionDests {
				if d.ID == eval.DestinationID {
					hasAccess = true
					break
				}
			}
			if !hasAccess {
				return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
			}

		default:
			// consultor, auditor, etc. — fallback to explicit grants
			userLevel, err := l.getUserAccessLevel(c, id)
			if err != nil {
				return err // already an HTTPError
			}
			if userLevel == "" {
				return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
			}
		}
	}

	// B06: compute allowed transitions from the current state
	sm := domain.NewStateMachine()
	transitions := sm.AllowedTransitions(eval.Status)

	return c.JSON(http.StatusOK, EvaluationDetailResponse{
		Evaluation:         *eval,
		AllowedTransitions: transitions,
	})
}

func (l *Logic) HandleUpdateEvaluation(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	// Check authorization: administracion level required
	hasAccess, err := l.hasAdminAccessToEvaluation(c, id)
	if err != nil {
		return err
	}
	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "administracion level required")
	}

	// Fetch existing to preserve type (cannot change after creation)
	existing, err := l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var req struct {
		Name                 string  `json:"name"`
		StartDate            *string `json:"start_date,omitempty"`
		EndDate              *string `json:"end_date,omitempty"`
		HasExternalEvaluator *bool   `json:"has_external_evaluator,omitempty"`
		Status               *string `json:"status,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.Name != "" {
		existing.Name = req.Name
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
	if req.HasExternalEvaluator != nil {
		existing.HasExternalEvaluator = *req.HasExternalEvaluator
	}
	existing.UpdatedAt = time.Now()

	if err := l.repo.UpdateEvaluation(c.Request().Context(), existing); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, existing)
}

func (l *Logic) HandleDeleteEvaluation(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	hasAccess, err := l.hasAdminAccessToEvaluation(c, id)
	if err != nil {
		return err
	}
	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "administracion level required")
	}

	// Only allow delete when status is borrador (global admin can delete any)
	existing, err := l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if existing.Status != domain.EvaluationStatusBorrador && existing.Status != domain.EvaluationStatusEnCurso && roleFromCtx(c) != "admin" {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "can only delete evaluations in borrador status")
	}

	if err := l.repo.DeleteEvaluation(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ── Response DTOs ─────────────────────────────────────────────────────

// EvaluationDetailResponse wraps an Evaluation with allowed transitions.
type EvaluationDetailResponse struct {
	domain.Evaluation
	AllowedTransitions []domain.EvaluationStatus `json:"allowed_transitions,omitempty"`
}

// PaginatedEvaluationsResponse wraps a list of evaluations with pagination metadata.
type PaginatedEvaluationsResponse struct {
	Data   []*domain.Evaluation `json:"data"`
	Total  int                  `json:"total"`
	Limit  int                  `json:"limit"`
	Offset int                  `json:"offset"`
}

// parsePagination extracts limit and offset from query parameters with defaults.
func parsePagination(c echo.Context) (limit, offset int) {
	limit = 20
	offset = 0
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}
	return
}

// emptyPaginatedResponse returns a PaginatedEvaluationsResponse with empty data.
func emptyPaginatedResponse(limit, offset int) PaginatedEvaluationsResponse {
	return PaginatedEvaluationsResponse{
		Data:   []*domain.Evaluation{},
		Total:  0,
		Limit:  limit,
		Offset: offset,
	}
}

// ══════════════════════════════════════════════════════════════════════
// State Machine — Change Status
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleChangeStatus(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	var req domain.ChangeStatusRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Check authorization: only administracion level can change status
	hasAccess, err := l.hasAdminAccessToEvaluation(c, id)
	if err != nil {
		return err
	}
	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "administracion level required")
	}

	existing, err := l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	sm := domain.NewStateMachine()
	targetStatus := domain.EvaluationStatus(req.Status)

	if !sm.CanTransition(existing.Status, targetStatus) {
		allowed := sm.AllowedTransitions(existing.Status)
		return c.JSON(http.StatusUnprocessableEntity, domain.ChangeStatusResponse{
			AllowedTransitions: allowed,
			Message:            "invalid transition",
		})
	}

	existing.Status = targetStatus
	existing.UpdatedAt = time.Now()
	if targetStatus == domain.EvaluationStatusEnCurso && existing.StartDate == nil {
		now := time.Now()
		existing.StartDate = &now
	}
	if targetStatus == domain.EvaluationStatusCerrada && existing.EndDate == nil {
		now := time.Now()
		existing.EndDate = &now
	}

	if err := l.repo.UpdateEvaluation(c.Request().Context(), existing); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, existing)
}

// ══════════════════════════════════════════════════════════════════════
// Promotion
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandlePromoteEvaluation(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	// Authorization: administracion level required
	hasAccess, err := l.hasAdminAccessToEvaluation(c, id)
	if err != nil {
		return err
	}
	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "administracion level required to promote")
	}

	existing, err := l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Must be cerrada
	if existing.Status != domain.EvaluationStatusCerrada {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "can only promote evaluations in cerrada status")
	}

	// Determine next type
	nextType, ok := domain.NextEvaluationType(existing.Type)
	if !ok {
		return echo.NewHTTPError(http.StatusUnprocessableEntity,
			"evaluation type has no promotion target")
	}

	// Perform promotion via the repository (single transaction handled internally)
	userIDStr := userIDFromCtx(c)
	createdBy, _ := uuid.Parse(userIDStr)
	now := time.Now()

	newEval, err := l.promoteEvaluation(c.Request().Context(), existing, nextType, createdBy, now)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, newEval)
}

// promoteEvaluation performs the full promotion logic.
// It is extracted as a separate method for testability.
func (l *Logic) promoteEvaluation(ctx context.Context, source *domain.Evaluation, nextType domain.EvaluationType, createdBy uuid.UUID, now time.Time) (*domain.Evaluation, error) {
	// Begin transaction
	tx, err := l.repo.BeginTx(ctx)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to begin transaction")
	}

	// Use a boolean to track whether we committed
	committed := false
	if tx != nil {
		defer func() {
			if !committed {
				_ = tx.Rollback()
			}
		}()
	}

	// Step 1: Create new evaluation
	newEval := &domain.Evaluation{
		ID:                   uuid.New(),
		DestinationID:        source.DestinationID,
		Name:                 source.Name + " (" + string(nextType) + ")",
		Type:                 nextType,
		Status:               domain.EvaluationStatusBorrador,
		HasExternalEvaluator: false,
		PromotedFromID:       &source.ID,
		CreatedBy:            createdBy,
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	if tx != nil {
		if err := l.repo.CreateEvaluationTx(tx, newEval); err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to create promoted evaluation: "+err.Error())
		}
	} else {
		// Fallback for testing with mock that returns nil tx
		if err := l.repo.CreateEvaluation(ctx, newEval); err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to create promoted evaluation: "+err.Error())
		}
	}

	// Step 2: Copy indicator values (excluding AI fields)
	mapping, err := l.repo.CopyIndicatorValuesTx(tx, source.ID, newEval.ID)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to copy indicator values: "+err.Error())
	}

	// Step 3: Create indicator history entries for each copied value
	srcValues, err := l.repo.GetSourceIndicatorValueIDs(ctx, source.ID)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to read source values for history: "+err.Error())
	}
	for _, sv := range srcValues {
		newIVID, ok := mapping[sv.IndicatorID]
		if !ok {
			continue
		}
		if err := l.repo.CreateIndicatorHistoryTx(tx, source.ID, newIVID, sv.ID); err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to create indicator history: "+err.Error())
		}
	}

	// Step 4: Copy action indicator links with status snapshot
	if err := l.repo.CopyActionIndicatorLinksTx(tx, source.ID, newEval.ID); err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to copy action links: "+err.Error())
	}

	// Commit
	if tx != nil {
		if err := tx.Commit(); err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to commit promotion: "+err.Error())
		}
	}
	committed = true

	return newEval, nil
}

// ══════════════════════════════════════════════════════════════════════
// Scope Progress
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleScopeProgress(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	// Verify evaluation exists
	_, err = l.repo.FindEvaluationByID(c.Request().Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	progress, err := l.repo.GetScopeProgress(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Apply locale translations for scope names/descriptions
	if locale := c.QueryParam("locale"); locale != "" {
		for _, p := range progress {
			scopeUUID, err := uuid.Parse(p.ScopeID)
			if err != nil {
				continue
			}
			if t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "scope", scopeUUID, locale); t != nil {
				if t.Name != nil {
					p.ScopeName = *t.Name
				}
				if t.Description != nil {
					p.ScopeDescription = *t.Description
				}
			}
		}
	}

	return c.JSON(http.StatusOK, progress)
}
