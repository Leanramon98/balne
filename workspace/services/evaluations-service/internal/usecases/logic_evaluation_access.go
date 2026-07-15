package usecases

import (
	"context"
	"net/http"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// EvaluationUser — Access Management
// ══════════════════════════════════════════════════════════════════════

func (l *Logic) HandleListEvaluationUsers(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	// Authorization: administracion level required
	role := roleFromCtx(c)
	if !permissionEval.IsAdmin(role) {
		userLevel, err := l.getUserAccessLevel(c, id)
		if err != nil {
			return err
		}
		if !permissionEval.CanManageUsers(role, userLevel) {
			return echo.NewHTTPError(http.StatusForbidden, "administracion level required to manage users")
		}
	}

	items, err := l.repo.ListAccess(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// B04: Append implicit admin entries when the requesting user is admin
	if l.usersClient != nil && permissionEval.IsAdmin(role) {
		implicitEntries, err := l.fetchImplicitAdminUsers(c.Request().Context(), id)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch admin users: "+err.Error())
		}
		items = append(items, implicitEntries...)
	}

	return c.JSON(http.StatusOK, items)
}

// fetchImplicitAdminUsers calls users-service to get admin users and returns
// them as implicit EvaluationUser entries (not revocable, id=null).
func (l *Logic) fetchImplicitAdminUsers(ctx context.Context, evaluationID uuid.UUID) ([]*domain.EvaluationUser, error) {
	admins, err := l.usersClient.GetAdminUsers(ctx)
	if err != nil {
		return nil, err
	}
	var entries []*domain.EvaluationUser
	for _, a := range admins {
		uid := a.ID
		entries = append(entries, &domain.EvaluationUser{
			EvaluationID: evaluationID,
			UserID:       uid,
			AccessLevel:  domain.AccessLevelAdministracion,
			UserName:     a.Name,
			UserEmail:    a.Email,
			IsImplicit:   true,
			ID:           nil, // implicit — not revocable by direct grant
		})
	}
	return entries, nil
}

func (l *Logic) HandleGrantEvaluationAccess(c echo.Context) error {
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
		return echo.NewHTTPError(http.StatusForbidden, "administracion level required to manage users")
	}

	var req struct {
		UserID      string `json:"user_id"`
		AccessLevel string `json:"access_level"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.UserID == "" || req.AccessLevel == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "user_id and access_level are required")
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user_id")
	}

	level := domain.AccessLevel(req.AccessLevel)
	switch level {
	case domain.AccessLevelSoloLectura, domain.AccessLevelCarga,
		domain.AccessLevelEvaluador, domain.AccessLevelAdministracion:
		// valid
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "invalid access level")
	}

	if err := l.repo.GrantAccess(c.Request().Context(), id, userID, level); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "granted"})
}

func (l *Logic) HandleRevokeEvaluationAccess(c echo.Context) error {
	evalID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid evaluation id")
	}

	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}

	// Authorization: administracion level required
	hasAccess, err := l.hasAdminAccessToEvaluation(c, evalID)
	if err != nil {
		return err
	}
	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "administracion level required to manage users")
	}

	if err := l.repo.RevokeAccess(c.Request().Context(), evalID, userID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
