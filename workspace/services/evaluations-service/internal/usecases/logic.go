package usecases

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"strconv"
	"strings"

	"evaluations-service/internal/adapters/out/deepl"
	"evaluations-service/internal/adapters/out/messaging"
	"evaluations-service/internal/adapters/out/postgres"
	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// PermissionEvaluator is the domain permission checker.
var permissionEval = domain.NewPermissionEvaluator()

// Helper: extract user info from Echo context (set by JWT middleware)
func userIDFromCtx(c echo.Context) string {
	if uid, ok := c.Get("user_id").(string); ok {
		return uid
	}
	return ""
}

func roleFromCtx(c echo.Context) string {
	if r, ok := c.Get("role").(string); ok {
		return r
	}
	return ""
}

func destinationIDFromCtx(c echo.Context) *string {
	if did, ok := c.Get("destination_id").(*string); ok {
		return did
	}
	return nil
}

func userNameFromCtx(c echo.Context) string {
	if name, ok := c.Get("user_name").(string); ok {
		return name
	}
	return ""
}

// getUserAccessLevel looks up the user's explicit access level on an evaluation.
func (l *Logic) getUserAccessLevel(ctx echo.Context, evaluationID uuid.UUID) (domain.AccessLevel, error) {
	userIDStr := userIDFromCtx(ctx)
	if userIDStr == "" {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
	}
	uID, err := uuid.Parse(userIDStr)
	if err != nil {
		return "", echo.NewHTTPError(http.StatusBadRequest, "invalid user id in token")
	}
	level, err := l.repo.GetUserAccessLevel(ctx.Request().Context(), evaluationID, uID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil // No explicit access
		}
		return "", echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return level, nil
}

// UsersClient defines the interface for communicating with users-service.
type UsersClient interface {
	GetAdminUsers(ctx context.Context) ([]AdminUser, error)
}

// AdminUser is a DTO for admin users from users-service.
type AdminUser struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Email string   `json:"email"`
}

// Logic contains all use case implementations for the evaluations-service.
// It holds the repository and provides Echo handler methods.
type Logic struct {
	db          *sql.DB
	repo        domain.Repository
	publisher   messaging.Publisher
	usersClient UsersClient
	deeplClient domain.DeepLClient
}

// NewLogic constructs the use case with its dependencies.
// When DEEPL_API_KEY is set in the environment, the DeepL translation client
// is automatically wired so that good practice designations trigger Portuguese
// translations.
func NewLogic(db *sql.DB) *Logic {
	repo := postgres.NewRepository(db)
	pub := messaging.NewNoOpPublisher(false)

	var deeplClient domain.DeepLClient
	if os.Getenv("DEEPL_API_KEY") != "" {
		deeplClient = deepl.NewClient()
	}

	return &Logic{db: db, repo: repo, publisher: pub, deeplClient: deeplClient}
}

// NewLogicWithDeepL constructs a Logic with a DeepL client for automatic action translation.
func NewLogicWithDeepL(db *sql.DB, deeplClient domain.DeepLClient) *Logic {
	repo := postgres.NewRepository(db)
	pub := messaging.NewNoOpPublisher(false)
	return &Logic{db: db, repo: repo, publisher: pub, deeplClient: deeplClient}
}

// NewLogicWithRepo constructs a Logic with a provided repository (for testing).
func NewLogicWithRepo(repo domain.Repository) *Logic {
	pub := messaging.NewNoOpPublisher(false)
	return &Logic{db: nil, repo: repo, publisher: pub}
}

// NewLogicWithFullDeps constructs a Logic with all dependencies injected (for testing).
func NewLogicWithFullDeps(repo domain.Repository, usersClient UsersClient) *Logic {
	pub := messaging.NewNoOpPublisher(false)
	return &Logic{db: nil, repo: repo, publisher: pub, usersClient: usersClient}
}

// NewLogicWithFullDepsAndDeepL constructs a Logic with all dependencies including DeepL (for testing).
func NewLogicWithFullDepsAndDeepL(repo domain.Repository, usersClient UsersClient, deeplClient domain.DeepLClient) *Logic {
	pub := messaging.NewNoOpPublisher(false)
	return &Logic{db: nil, repo: repo, publisher: pub, usersClient: usersClient, deeplClient: deeplClient}
}

// ── Shared Helpers ──────────────────────────────────────────────────

// canWriteIndicator checks if the user's role allows writing indicator values.
func canWriteIndicator(role string) bool {
	switch role {
	case "admin", "admin_destino", "gestor_destino":
		return true
	default:
		return false
	}
}

// hasAdminAccessToEvaluation checks if the user has administracion-level access
// to an evaluation. For admin_destino, this checks destination_id from JWT vs
// the evaluation's destination_id. For other non-admin roles, falls back to
// the evaluation_user table.
func (l *Logic) hasAdminAccessToEvaluation(c echo.Context, evalID uuid.UUID) (bool, error) {
	role := roleFromCtx(c)

	// Super admin always has access
	if permissionEval.IsAdmin(role) {
		return true, nil
	}

	// admin_destino: check if the evaluation belongs to their destination
	if role == "admin_destino" {
		eval, err := l.repo.FindEvaluationByID(c.Request().Context(), evalID)
		if err != nil {
			if err == sql.ErrNoRows {
				return false, echo.NewHTTPError(http.StatusNotFound, "evaluation not found")
			}
			return false, echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		userDestID := destinationIDFromCtx(c)
		return permissionEval.BelongsToDestination(role, userDestID, eval.DestinationID.String()), nil
	}

	// gestor_destino, gestor_regional, consultor, auditor, etc.
	// fallback to explicit grants in evaluation_user
	userLevel, err := l.getUserAccessLevel(c, evalID)
	if err != nil {
		return false, err
	}
	return permissionEval.CanChangeStatus(role, userLevel), nil
}

// parseUUID parses a UUID from a path parameter with query param fallback.
func (l *Logic) parseUUID(c echo.Context, param string) (uuid.UUID, bool) {
	val := c.Param(param)
	if val == "" {
		val = c.QueryParam(strings.TrimPrefix(param, ":"))
	}
	id, err := uuid.Parse(val)
	return id, err == nil
}

func formatYear(year int) string {
	if year <= 0 {
		return ""
	}
	return strconv.Itoa(year)
}
