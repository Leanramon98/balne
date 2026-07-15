package usecases

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"evaluations-service/internal/adapters/out/messaging"
	"evaluations-service/internal/domain"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ── Value Validation ─────────────────────────────────────────────────

// ValidateIndicatorValue checks that a value is valid for the given indicator type.
func ValidateIndicatorValue(indicatorType domain.IndicatorType, value int) error {
	switch indicatorType {
	case domain.IndicatorTypeGradient:
		if value < 0 || value > 100 {
			return echo.NewHTTPError(http.StatusBadRequest, "gradient value must be between 0 and 100")
		}
	case domain.IndicatorTypeBoolean:
		if value != 0 && value != 1 {
			return echo.NewHTTPError(http.StatusBadRequest, "boolean value must be 0 or 1")
		}
	case domain.IndicatorTypeNumeric:
		if value < 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "numeric value must be >= 0")
		}
	case domain.IndicatorTypeSuma:
		if value < 0 || value > 100 {
			return echo.NewHTTPError(http.StatusBadRequest, "suma value must be between 0 and 100")
		}
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "unknown indicator type")
	}
	return nil
}

// ── AI Field Visibility ──────────────────────────────────────────────

// FilterIndicatorValueResponse filters sensitive AI fields based on the user's access level.
// - analisis_ia (public): visible to ALL users with evaluation access
// - sugerencias_mejora_ia (private): visible ONLY to evaluador level or higher (or admin)
func FilterIndicatorValueResponse(iv *domain.IndicatorValue, role string, accessLevel domain.AccessLevel) *domain.IndicatorValue {
	// Admin always sees everything
	if IsAdminRole(role) {
		return iv
	}

	// Check if user has evaluador-level access or higher
	canSeeSuggestions := accessLevel == domain.AccessLevelEvaluador ||
		accessLevel == domain.AccessLevelAdministracion ||
		// Also check roles that implicitly have evaluador access
		role == "consultor" || role == "auditor" || role == "admin_destino"

	// Create a filtered copy
	filtered := *iv

	if !canSeeSuggestions {
		filtered.SugerenciasMejoraIA = nil
	}

	return &filtered
}

// IsAdminRole checks if a role string indicates admin-level access.
func IsAdminRole(role string) bool {
	return role == "admin" || role == "admin_destino"
}

// ── Helper: get evaluation access level with admin bypass ────────────

func (l *Logic) getEffectiveAccessLevel(c echo.Context, evalID uuid.UUID) (domain.AccessLevel, error) {
	role := roleFromCtx(c)
	if IsAdminRole(role) {
		return domain.AccessLevelAdministracion, nil
	}

	level, err := l.getUserAccessLevel(c, evalID)
	if err != nil {
		return "", err
	}
	return level, nil
}

// ══════════════════════════════════════════════════════════════════════
// 1e.1 — Save Destination Value
// PUT /evaluations/{evaluationId}/indicators/{id}/value
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleSaveDestinationValue(c echo.Context) error {
	evalID, err := uuid.Parse(c.Param("evaluationId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}
	indicatorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator id")
	}

	// Fetch the evaluation
	eval, err := l.repo.FindEvaluationByID(c.Request().Context(), evalID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Check access: GestorDestino+ can write when evaluation is en_curso
	// OR when evaluator has enabled editing for this indicator
	role := roleFromCtx(c)
	userLevel, _ := l.getEffectiveAccessLevel(c, evalID)

	canWriteDest := false
	if eval.Status == domain.EvaluationStatusEnCurso || eval.Status == domain.EvaluationStatusBorrador {
		// GestorDestino+, AdminDestino, Admin can write during borrador or en_curso
		canWriteDest = IsAdminRole(role) || canWriteIndicator(role)
	} else {
		// Check if evaluator enabled editing for this indicator
		existingIV, err := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
		if err == nil && existingIV != nil && existingIV.IsEditingEnabled {
			canWriteDest = true
		}
	}

	if !canWriteDest {
		return echo.NewHTTPError(http.StatusForbidden, "cannot write destination value for this evaluation")
	}

	// Parse request body
	var req struct {
		DestinationValue        *int    `json:"destination_value"`
		Meta                    *int    `json:"meta,omitempty"`
		MetaDate                *string `json:"meta_date,omitempty"`
		DestinationObservations *string `json:"destination_observations,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.DestinationValue == nil {
		return echo.NewHTTPError(http.StatusBadRequest, "destination_value is required")
	}

	// Fetch the indicator for type validation
	indicator, err := l.repo.FindIndicatorByID(c.Request().Context(), indicatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "indicator not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Validate value against indicator type
	if err := ValidateIndicatorValue(indicator.Type, *req.DestinationValue); err != nil {
		return err
	}

	// Check if indicator value already exists for this eval+indicator
	existingIV, err := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
	if err != nil && err != sql.ErrNoRows {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	now := time.Now()

	if existingIV != nil {
		// Save previous value to history before updating
		history := &domain.IndicatorHistory{
			ID:                   uuid.New(),
			IndicatorValueID:     existingIV.ID,
			PreviousEvaluationID: evalID,
			DestinationValue:     req.DestinationValue,
			Meta:                 req.Meta,
			Observations:         req.DestinationObservations,
			Source:               "manual",
			ModifiedBy:           userNameFromCtx(c),
			CreatedAt:            now,
		}
		if err := l.repo.CreateIndicatorHistory(c.Request().Context(), history); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to create history: "+err.Error())
		}

		// Update existing
		existingIV.DestinationValue = req.DestinationValue
		existingIV.Meta = req.Meta
		if req.MetaDate != nil {
			t, err := time.Parse("2006-01-02", *req.MetaDate)
			if err == nil {
				existingIV.MetaDate = &t
			}
		}
		existingIV.DestinationObservations = req.DestinationObservations
		existingIV.UpdatedAt = now

		if err := l.repo.UpdateIndicatorValue(c.Request().Context(), existingIV); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	} else {
		// Create new indicator value
		var metaDate *time.Time
		if req.MetaDate != nil {
			t, err := time.Parse("2006-01-02", *req.MetaDate)
			if err == nil {
				metaDate = &t
			}
		}

		newIV := &domain.IndicatorValue{
			ID:                      uuid.New(),
			IndicatorID:             indicatorID,
			EvaluationID:            evalID,
			DestinationValue:        req.DestinationValue,
			Meta:                    req.Meta,
			MetaDate:                metaDate,
			DestinationObservations: req.DestinationObservations,
			CreatedAt:               now,
			UpdatedAt:               now,
		}

		if err := l.repo.CreateIndicatorValue(c.Request().Context(), newIV); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		// Create initial history entry for the first save
		initialHistory := &domain.IndicatorHistory{
			ID:                   uuid.New(),
			IndicatorValueID:     newIV.ID,
			PreviousEvaluationID: evalID,
			DestinationValue:     req.DestinationValue,
			Meta:                 req.Meta,
			Observations:         req.DestinationObservations,
			Source:               "manual",
			ModifiedBy:           userNameFromCtx(c),
			CreatedAt:            now,
		}
		if err := l.repo.CreateIndicatorHistory(c.Request().Context(), initialHistory); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to create initial history: "+err.Error())
		}
	}

	// Auto-transition from borrador → en_curso after a successful save
	var statusChanged bool
	if eval.Status == domain.EvaluationStatusBorrador {
		sm := domain.NewStateMachine()
		if sm.CanTransition(eval.Status, domain.EvaluationStatusEnCurso) {
			eval.Status = domain.EvaluationStatusEnCurso
			nowTime := time.Now()
			if eval.StartDate == nil {
				eval.StartDate = &nowTime
			}
			eval.UpdatedAt = nowTime
			if err := l.repo.UpdateEvaluation(c.Request().Context(), eval); err != nil {
				// Log but don't fail — the value was already saved
				c.Logger().Errorf("failed to auto-transition evaluation %s: %v", evalID, err)
			}
			statusChanged = true
		}
	}

	// Re-fetch to get the latest state
	resultIV, _ := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
	if resultIV != nil {
		// Filter AI fields for the response
		filteredIV := FilterIndicatorValueResponse(resultIV, role, userLevel)
		resp := domain.SaveDestinationValueResponse{
			IndicatorValue: filteredIV,
		}
		if statusChanged {
			t := true
			resp.StatusChanged = &t
			s := domain.EvaluationStatusEnCurso
			resp.NewStatus = &s
		}
		return c.JSON(http.StatusOK, resp)
	}

	return c.JSON(http.StatusOK, domain.SaveDestinationValueResponse{
		IndicatorValue: nil,
	})
}

// ══════════════════════════════════════════════════════════════════════
// 1e.1 — Save Evaluator Value
// PUT /evaluations/{evaluationId}/indicators/{id}/evaluator
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleSaveEvaluatorValue(c echo.Context) error {
	log.Printf("[HandleSaveEvaluatorValue] START evalID=%s indicatorID=%s", c.Param("evaluationId"), c.Param("id"))
	
	evalID, err := uuid.Parse(c.Param("evaluationId"))
	if err != nil {
		log.Printf("[HandleSaveEvaluatorValue] ERROR parsing evaluationId: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}
	indicatorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("[HandleSaveEvaluatorValue] ERROR parsing indicatorId: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator id")
	}

	// Only Consultor/Auditor can set evaluator values
	role := roleFromCtx(c)
	log.Printf("[HandleSaveEvaluatorValue] role=%s", role)
	if role != "consultor" && role != "auditor" && !IsAdminRole(role) {
		log.Printf("[HandleSaveEvaluatorValue] ERROR forbidden role=%s", role)
		return echo.NewHTTPError(http.StatusForbidden, "only consultor, auditor, or admin can set evaluator values")
	}

	// Fetch evaluation
	eval, err := l.repo.FindEvaluationByID(c.Request().Context(), evalID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[HandleSaveEvaluatorValue] ERROR evaluation not found")
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		log.Printf("[HandleSaveEvaluatorValue] ERROR fetching evaluation: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[HandleSaveEvaluatorValue] evaluation status=%s", eval.Status)

	// Only when evaluation is en_evaluacion
	if eval.Status != domain.EvaluationStatusEnEvaluacion && !IsAdminRole(role) {
		log.Printf("[HandleSaveEvaluatorValue] ERROR evaluation not in en_evaluacion status=%s", eval.Status)
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "evaluation must be in en_evaluacion status")
	}

	var req struct {
		EvaluatorValue        *int    `json:"evaluator_value"`
		EvaluatorObservations *string `json:"evaluator_observations,omitempty"`
		IsVerified            bool    `json:"is_verified,omitempty"`
		IsEditingEnabled      bool    `json:"is_editing_enabled,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		log.Printf("[HandleSaveEvaluatorValue] ERROR binding request: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	log.Printf("[HandleSaveEvaluatorValue] request parsed: evaluator_value=%v, evaluator_observations=%v", 
		req.EvaluatorValue, req.EvaluatorObservations)

	if req.EvaluatorValue == nil {
		log.Printf("[HandleSaveEvaluatorValue] ERROR evaluator_value is nil")
		return echo.NewHTTPError(http.StatusBadRequest, "evaluator_value is required")
	}

	// Validate against indicator type
	indicator, err := l.repo.FindIndicatorByID(c.Request().Context(), indicatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[HandleSaveEvaluatorValue] ERROR indicator not found")
			return echo.NewHTTPError(http.StatusNotFound, "indicator not found")
		}
		log.Printf("[HandleSaveEvaluatorValue] ERROR fetching indicator: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[HandleSaveEvaluatorValue] indicator type=%s", indicator.Type)
	
	if err := ValidateIndicatorValue(indicator.Type, *req.EvaluatorValue); err != nil {
		log.Printf("[HandleSaveEvaluatorValue] ERROR validating value: %v", err)
		return err
	}

	now := time.Now()
	userIDStr := userIDFromCtx(c)
	log.Printf("[HandleSaveEvaluatorValue] userID=%s", userIDStr)

	// Check for existing
	existingIV, err := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("[HandleSaveEvaluatorValue] ERROR finding existing indicator value: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[HandleSaveEvaluatorValue] existingIV found=%v", existingIV != nil)

	if existingIV != nil {
		log.Printf("[HandleSaveEvaluatorValue] UPDATING existing indicator value ID=%s", existingIV.ID)
		// Save history if this is the FIRST evaluator save (IV was created by destino
		// and had no EvaluatorValue yet) OR if the evaluator value actually changed.
		// The previous check `existingIV.EvaluatorValue != nil && *existingIV.EvaluatorValue != *req.EvaluatorValue`
		// dropped the first-evaluator-save case, leaving the initial entry unrecorded.
		evaluatorValueChanged := existingIV.EvaluatorValue == nil || *existingIV.EvaluatorValue != *req.EvaluatorValue
		if evaluatorValueChanged {
			prevValue := "<nil>"
			if existingIV.EvaluatorValue != nil {
				prevValue = fmt.Sprintf("%d", *existingIV.EvaluatorValue)
			}
			log.Printf("[HandleSaveEvaluatorValue] value changed from %s to %d, creating history",
				prevValue, *req.EvaluatorValue)
			history := &domain.IndicatorHistory{
				ID:                   uuid.New(),
				IndicatorValueID:     existingIV.ID,
				PreviousEvaluationID: evalID,
				EvaluatorValue:       req.EvaluatorValue,
				Meta:                 existingIV.Meta,
				Observations:         req.EvaluatorObservations,
				Source:               "evaluation",
				ModifiedBy:           userNameFromCtx(c),
				CreatedAt:            now,
			}
			if err := l.repo.CreateIndicatorHistory(c.Request().Context(), history); err != nil {
				log.Printf("[HandleSaveEvaluatorValue] ERROR creating history: %v", err)
				return echo.NewHTTPError(http.StatusInternalServerError, "failed to create history: "+err.Error())
			}
			log.Printf("[HandleSaveEvaluatorValue] history created successfully")
		} else {
			log.Printf("[HandleSaveEvaluatorValue] value not changed, skipping history")
		}

		existingIV.EvaluatorValue = req.EvaluatorValue
		existingIV.EvaluatorObservations = req.EvaluatorObservations
		existingIV.IsEditingEnabled = req.IsEditingEnabled

		if req.IsVerified {
			existingIV.IsVerified = true
			existingIV.VerifiedBy = &userIDStr
			existingIV.VerifiedAt = &now
		}

		existingIV.UpdatedAt = now

		log.Printf("[HandleSaveEvaluatorValue] calling UpdateIndicatorValue")
		if err := l.repo.UpdateIndicatorValue(c.Request().Context(), existingIV); err != nil {
			log.Printf("[HandleSaveEvaluatorValue] ERROR updating indicator value: %v", err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		log.Printf("[HandleSaveEvaluatorValue] UPDATE successful")
	} else {
		log.Printf("[HandleSaveEvaluatorValue] CREATING new indicator value")
		// Create with evaluator value
		newIV := &domain.IndicatorValue{
			ID:                  uuid.New(),
			IndicatorID:         indicatorID,
			EvaluationID:        evalID,
			EvaluatorValue:      req.EvaluatorValue,
			EvaluatorObservations: req.EvaluatorObservations,
			IsEditingEnabled:    req.IsEditingEnabled,
			IsVerified:          req.IsVerified,
			CreatedAt:           now,
			UpdatedAt:           now,
		}
		if req.IsVerified {
			newIV.VerifiedBy = &userIDStr
			newIV.VerifiedAt = &now
		}

		log.Printf("[HandleSaveEvaluatorValue] calling CreateIndicatorValue")
		if err := l.repo.CreateIndicatorValue(c.Request().Context(), newIV); err != nil {
			log.Printf("[HandleSaveEvaluatorValue] ERROR creating indicator value: %v", err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		log.Printf("[HandleSaveEvaluatorValue] CREATE successful")

		// Create initial history entry for the first save
		initialHistory := &domain.IndicatorHistory{
			ID:                   uuid.New(),
			IndicatorValueID:     newIV.ID,
			PreviousEvaluationID: evalID,
			EvaluatorValue:       req.EvaluatorValue,
			Meta:                 nil,
			Observations:         req.EvaluatorObservations,
			Source:               "evaluation",
			ModifiedBy:           userNameFromCtx(c),
			CreatedAt:            now,
		}
		if err := l.repo.CreateIndicatorHistory(c.Request().Context(), initialHistory); err != nil {
			log.Printf("[HandleSaveEvaluatorValue] ERROR creating initial history: %v", err)
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to create initial history: "+err.Error())
		}
		log.Printf("[HandleSaveEvaluatorValue] initial history created")
	}

	log.Printf("[HandleSaveEvaluatorValue] SUCCESS")
	return c.JSON(http.StatusOK, map[string]string{"status": "saved"})
}

// ══════════════════════════════════════════════════════════════════════
// 1e.1 — Save AI Fields
// PUT /evaluations/{evaluationId}/indicators/{id}/ai
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleSaveAIFields(c echo.Context) error {
	evalID, err := uuid.Parse(c.Param("evaluationId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}
	indicatorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator id")
	}

	// Only admin can manually set AI fields (for now)
	role := roleFromCtx(c)
	if !IsAdminRole(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only admin can set AI fields")
	}

	var req struct {
		AnalisisIA          *string `json:"analisis_ia"`
		SugerenciasMejoraIA *string `json:"sugerencias_mejora_ia"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	existingIV, err := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
	if err != nil && err != sql.ErrNoRows {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	now := time.Now()

	if existingIV != nil {
		if req.AnalisisIA != nil {
			existingIV.AnalisisIA = req.AnalisisIA
		}
		if req.SugerenciasMejoraIA != nil {
			existingIV.SugerenciasMejoraIA = req.SugerenciasMejoraIA
		}
		existingIV.UpdatedAt = now

		if err := l.repo.UpdateIndicatorValue(c.Request().Context(), existingIV); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	} else {
		newIV := &domain.IndicatorValue{
			ID:                  uuid.New(),
			IndicatorID:         indicatorID,
			EvaluationID:        evalID,
			AnalisisIA:          req.AnalisisIA,
			SugerenciasMejoraIA: req.SugerenciasMejoraIA,
			CreatedAt:           now,
			UpdatedAt:           now,
		}
		if err := l.repo.CreateIndicatorValue(c.Request().Context(), newIV); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "saved"})
}

// ══════════════════════════════════════════════════════════════════════
// 1e.2 — Delete Destination Value
// DELETE /evaluations/{evaluationId}/indicators/{id}/value
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleDeleteDestinationValue(c echo.Context) error {
	evalID, err := uuid.Parse(c.Param("evaluationId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}
	indicatorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator id")
	}

	// Fetch the evaluation (must be en_curso)
	eval, err := l.repo.FindEvaluationByID(c.Request().Context(), evalID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if eval.Status != domain.EvaluationStatusEnCurso {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "can only delete values in en_curso status")
	}

	// Access: GestorDestino+
	role := roleFromCtx(c)
	if !IsAdminRole(role) && !canWriteIndicator(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only gestor_destino, admin_destino, or admin can delete values")
	}

	// Find the indicator value
	existingIV, err := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "indicator value not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Delete the value content (keep history)
	if err := l.repo.DeleteIndicatorValueContent(c.Request().Context(), existingIV.ID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

// ══════════════════════════════════════════════════════════════════════
// 1e.3 — Create Indicator Message
// POST /indicators/{indicatorValueId}/messages
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleCreateIndicatorMessage(c echo.Context) error {
	ivID, err := uuid.Parse(c.Param("indicatorValueId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator value id")
	}

	// Verify the indicator value exists
	_, err = l.repo.FindIndicatorValueByID(c.Request().Context(), ivID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "indicator value not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var req struct {
		Message string `json:"message"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if strings.TrimSpace(req.Message) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "message is required")
	}

	userIDStr := userIDFromCtx(c)
	if userIDStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}

	now := time.Now()
	msg := &domain.IndicatorMessage{
		ID:               uuid.New(),
		IndicatorValueID: ivID,
		UserID:           userID,
		Message:          req.Message,
		CreatedAt:        now,
	}

	if err := l.repo.CreateIndicatorMessage(c.Request().Context(), msg); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Enrich message with user name and avatar from users_service
	if l.db != nil {
		_ = l.db.QueryRowContext(c.Request().Context(),
			`SELECT COALESCE(u.fullname, ''), COALESCE(p.avatarurl, '')
			 FROM users_service.user u
			 LEFT JOIN users_service.userprofile p ON p.userid = u.id
			 WHERE u.id = $1`, userID,
		).Scan(&msg.UserName, &msg.UserAvatar)
	}

	// Emit RabbitMQ event (stub — actual implementation will use the publisher)
	// For now, we just log it. The publisher will be wired in when RabbitMQ is available.
	_ = l.publishIndicatorMessageSent(c.Request().Context(), msg)


	return c.JSON(http.StatusCreated, msg)
}

// ══════════════════════════════════════════════════════════════════════
// 1e.3 — List Indicator Messages
// GET /indicators/{indicatorValueId}/messages
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListIndicatorMessages(c echo.Context) error {
	ivID, err := uuid.Parse(c.Param("indicatorValueId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator value id")
	}

	// Verify the indicator value exists
	_, err = l.repo.FindIndicatorValueByID(c.Request().Context(), ivID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "indicator value not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	messages, err := l.repo.ListIndicatorMessages(c.Request().Context(), ivID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, messages)
}

// ══════════════════════════════════════════════════════════════════════
// 1e.5 — AI Analysis Trigger
// POST /indicators/{id}/analyze
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleTriggerAIAnalysis(c echo.Context) error {
	ivID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator value id")
	}

	// Verify the indicator value exists
	iv, err := l.repo.FindIndicatorValueByID(c.Request().Context(), ivID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "indicator value not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Emulate AI Analysis synchronously for the MVP
	analysis := "Análisis automático generado para el indicador basado en las evidencias. Se han identificado áreas de mejora."
	suggestions := "1. Reforzar la documentación y evidencias\n2. Monitorear el progreso en el próximo semestre\n3. Capacitar al personal asignado"

	iv.AnalisisIA = &analysis
	iv.SugerenciasMejoraIA = &suggestions
	iv.UpdatedAt = time.Now()

	if err := l.repo.UpdateIndicatorValue(c.Request().Context(), iv); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, iv)
}

// ══════════════════════════════════════════════════════════════════════
// 1e.6 + 1e.9 — Get Indicator Value (detail with AI filtering + history)
// GET /evaluations/{evaluationId}/indicators/{id}
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleGetIndicatorValue(c echo.Context) error {
	evalID, err := uuid.Parse(c.Param("evaluationId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}
	indicatorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid indicator id")
	}

	// Check access to the evaluation
	userIDStr := userIDFromCtx(c)
	if userIDStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}

	// Verify evaluation exists
	_, err = l.repo.FindEvaluationByID(c.Request().Context(), evalID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Get effective access level
	role := roleFromCtx(c)
	userLevel, err := l.getEffectiveAccessLevel(c, evalID)
	if err != nil {
		return err
	}
	if userLevel == "" && !IsAdminRole(role) {
		return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
	}

	// Find the indicator value
	iv, err := l.repo.FindIndicatorValueByEvalAndIndicator(c.Request().Context(), evalID, indicatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "indicator value not found for this evaluation")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Apply AI field visibility filter
	filteredIV := FilterIndicatorValueResponse(iv, role, userLevel)

	// Include history
	history, err := l.repo.ListIndicatorHistory(c.Request().Context(), iv.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	resp := struct {
		*domain.IndicatorValue
		History []*domain.IndicatorHistory `json:"history"`
	}{
		IndicatorValue: filteredIV,
		History:        history,
	}

	return c.JSON(http.StatusOK, resp)
}

// ══════════════════════════════════════════════════════════════════════
// List Indicators By Scope And Evaluation (with values)
// GET /evaluations/{evaluationId}/scopes/{scopeId}/indicators
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListIndicatorsByScopeAndEval(c echo.Context) error {
	evalID, err := uuid.Parse(c.Param("evaluationId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}
	scopeID, err := uuid.Parse(c.Param("scopeId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid scope id")
	}

	// Check access to the evaluation
	_, err = l.repo.FindEvaluationByID(c.Request().Context(), evalID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	role := roleFromCtx(c)
	userLevel, err := l.getEffectiveAccessLevel(c, evalID)
	if err != nil {
		return err
	}
	if userLevel == "" && !IsAdminRole(role) {
		return echo.NewHTTPError(http.StatusForbidden, "no access to this evaluation")
	}

	indicators, err := l.repo.FindIndicatorsByScopeAndEvaluation(c.Request().Context(), scopeID, evalID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Apply locale translations for indicator names/descriptions/criteria
	if locale := c.QueryParam("locale"); locale != "" {
		for _, ind := range indicators {
			t, _ := l.repo.FindCatalogTranslation(c.Request().Context(), "indicator", ind.ID, locale)
			l.applyIndicatorWithValueTranslation(ind, t)
		}
	}

	// Filter sensitive AI fields based on access level
	for _, ind := range indicators {
		if !IsAdminRole(role) &&
			userLevel != domain.AccessLevelEvaluador &&
			userLevel != domain.AccessLevelAdministracion &&
			role != "consultor" && role != "auditor" && role != "admin_destino" {
			ind.SugerenciasMejoraIA = nil
		}
	}

	return c.JSON(http.StatusOK, indicators)
}

// ── RabbitMQ publish wrappers ─────────────────────────────────────

// publishIndicatorMessageSent publishes an indicator.message.sent event.
func (l *Logic) publishIndicatorMessageSent(ctx context.Context, msg *domain.IndicatorMessage) error {
	return l.publisher.PublishIndicatorMessageSent(ctx, messaging.MessageSentPayload{
		IndicatorValueID: msg.IndicatorValueID,
		UserID:           msg.UserID,
		Message:          msg.Message,
		CreatedAt:        msg.CreatedAt,
	})
}

// publishIndicatorAnalysisRequested publishes an indicator.analyze event.
func (l *Logic) publishIndicatorAnalysisRequested(ctx context.Context, indicatorValueID uuid.UUID) error {
	return l.publisher.PublishIndicatorAnalysisRequested(ctx, messaging.AnalysisRequestedPayload{
		IndicatorValueID: indicatorValueID,
		RequestedAt:      time.Now(),
	})
}

// ── Helpers ────────────────────────────────────────────────────────
