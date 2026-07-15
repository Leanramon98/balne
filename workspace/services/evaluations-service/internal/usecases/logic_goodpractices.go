package usecases

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// GoodPractice Lifecycle
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleDesignateGoodPractice(c echo.Context) error {
	role := roleFromCtx(c)
	if !permissionEval.CanDesignateGoodPractice(role) {
		return echo.NewHTTPError(http.StatusForbidden, "only consultor or auditor can designate good practices")
	}

	actionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action id")
	}

	// Verify action exists
	_, err = l.repo.FindActionByID(c.Request().Context(), actionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "action not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Check not already designated
	existing, err := l.repo.FindGoodPracticeByActionID(c.Request().Context(), actionID)
	if err != nil && err != sql.ErrNoRows {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if existing != nil {
		return echo.NewHTTPError(http.StatusConflict, "action already has a good practice designation")
	}

	userID, _ := uuid.Parse(userIDFromCtx(c))
	now := time.Now()
	gp := &domain.GoodPractice{
		ID:           uuid.New(),
		ActionID:     actionID,
		DesignatedBy: userID,
		DesignatedAt: now,
		Status:       domain.GpStatusDesignated,
	}

	if err := l.repo.CreateGoodPractice(c.Request().Context(), gp); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Trigger automatic PT translation (non-blocking, best-effort)
	action, err := l.repo.FindActionByID(c.Request().Context(), actionID)
	if err == nil && l.deeplClient != nil {
		go l.translateActionOnDesignation(action)
	}

	return c.JSON(http.StatusCreated, gp)
}

func (l *Logic) HandleApproveGoodPractice(c echo.Context) error {
	role := roleFromCtx(c)
	perms := c.Get("permissions")
	canApprove := false
	if perms != nil {
		if p, ok := perms.(struct {
			AccessScope             string
			CanWriteValues          bool
			CanManageUsers          bool
			CanApproveGoodPractices bool
			EvaluationTypes         []string
		}); ok {
			canApprove = p.CanApproveGoodPractices
		}
	}

	if !permissionEval.CanApproveGoodPractice(role, canApprove) {
		return echo.NewHTTPError(http.StatusForbidden, "only admin_destino or admin can approve/reject good practices")
	}

	actionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid action id")
	}

	gp, err := l.repo.FindGoodPracticeByActionID(c.Request().Context(), actionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "no good practice designation found for this action")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if gp.Status != domain.GpStatusDesignated {
		return echo.NewHTTPError(http.StatusConflict, "good practice is not in designated status")
	}

	var req struct {
		Action string `json:"action"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Action != "approve" && req.Action != "reject" {
		return echo.NewHTTPError(http.StatusBadRequest, "action must be 'approve' or 'reject'")
	}

	userID, _ := uuid.Parse(userIDFromCtx(c))
	now := time.Now()

	switch req.Action {
	case "approve":
		gp.Status = domain.GpStatusApproved
		gp.ApprovedBy = &userID
		gp.ApprovedAt = &now
	case "reject":
		gp.Status = domain.GpStatusRejected
		// Keep designated_by info, just mark rejected
	}

	if err := l.repo.UpdateGoodPractice(c.Request().Context(), gp); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, gp)
}

// ══════════════════════════════════════════════════════════════════════
// Public Good Practices (no auth)
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandlePublicGoodPractices(c echo.Context) error {
	filters := make(map[string]string)
	if v := c.QueryParam("country"); v != "" {
		filters["country"] = v
	}
	if v := c.QueryParam("axis"); v != "" {
		filters["axis"] = v
	}
	if v := c.QueryParam("scope"); v != "" {
		filters["scope"] = v
	}
	if v := c.QueryParam("ods"); v != "" {
		filters["ods"] = v
	}
	if v := c.QueryParam("search"); v != "" {
		filters["search"] = v
	}
	if v := c.QueryParam("locale"); v != "" {
		filters["locale"] = v
	}

	items, err := l.repo.FindApprovedGoodPractices(c.Request().Context(), filters)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// HandlePublicGoodPractice returns a single approved good practice by action ID.
func (l *Logic) HandlePublicGoodPractice(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	locale := c.QueryParam("locale")

	item, err := l.repo.FindApprovedGoodPracticeByActionID(c.Request().Context(), id, locale)
	if err != nil {
		if err == sql.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "good practice not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, item)
}

// translateActionOnDesignation translates action content to Portuguese via DeepL
// and stores the result in action_translation. Runs in a goroutine with a 5-second
// deadline. Failures are logged but never block the designation response.
func (l *Logic) translateActionOnDesignation(action *domain.Action) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	locale := "pt"

	// Check if translation already exists
	existing, err := l.repo.FindTranslationByActionAndLocale(ctx, action.ID, locale)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("[translate] error checking existing translation for action %s: %v", action.ID, err)
		return
	}
	if existing != nil {
		log.Printf("[translate] translation already exists for action %s", action.ID)
		return
	}

	// Translate name
	namePt, err := l.deeplClient.TranslateText(ctx, action.Name, "es", "pt")
	if err != nil {
		log.Printf("[translate] failed to translate name for action %s: %v", action.ID, err)
		return
	}
	if namePt == "" {
		namePt = action.Name // fallback to Spanish
	}

	// Translate summary
	var summaryPt *string
	if action.Summary != nil && *action.Summary != "" {
		s, err := l.deeplClient.TranslateText(ctx, *action.Summary, "es", "pt")
		if err != nil {
			log.Printf("[translate] failed to translate summary for action %s: %v", action.ID, err)
		} else if s != "" {
			summaryPt = &s
		}
	}

	// Translate extended description
	var descPt *string
	if action.ExtendedDescription != nil && *action.ExtendedDescription != "" {
		d, err := l.deeplClient.TranslateText(ctx, *action.ExtendedDescription, "es", "pt")
		if err != nil {
			log.Printf("[translate] failed to translate description for action %s: %v", action.ID, err)
		} else if d != "" {
			descPt = &d
		}
	}

	// Translate ODS contributions individually
	var odsPt json.RawMessage
	if len(action.ODS) > 0 {
		var odsList []domain.ODSGoal
		if err := json.Unmarshal(action.ODS, &odsList); err == nil {
			var translatedODS []domain.ODSGoal
			for _, ods := range odsList {
				contribPt, err := l.deeplClient.TranslateText(ctx, ods.Contribution, "es", "pt")
				if err != nil {
					log.Printf("[translate] failed to translate ODS %s contribution: %v", ods.OdsID, err)
				}
				if contribPt == "" {
					contribPt = ods.Contribution // fallback
				}
				translatedODS = append(translatedODS, domain.ODSGoal{
					OdsID:        ods.OdsID,
					Contribution: contribPt,
				})
			}
			if data, err := json.Marshal(translatedODS); err == nil {
				odsPt = data
			}
		}
	}

	// Persist translation
	now := time.Now()
	t := &domain.ActionTranslation{
		ID:                  uuid.New(),
		ActionID:            action.ID,
		Locale:              locale,
		Name:                namePt,
		Summary:             summaryPt,
		Description:         descPt,
		ODS:                 odsPt,
		TranslatedAt:        now,
		TranslationReviewed: false,
	}

	if err := l.repo.CreateTranslation(ctx, t); err != nil {
		log.Printf("[translate] failed to store translation for action %s: %v", action.ID, err)
		return
	}
	log.Printf("[translate] successfully translated action %s to pt", action.ID)
}
