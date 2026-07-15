package usecases

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"evaluations-service/internal/domain"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

var testPlanID = uuid.MustParse("55555555-5555-5555-5555-555555555555")
var testGoalID = uuid.MustParse("66666666-6666-6666-6666-666666666666")

// ── Test Helpers ──────────────────────────────────────────────────────

func setupDtiPlanTest(t *testing.T, role string) (*Logic, *mockRepo, echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	mock := newMockRepo()
	uc := NewLogicWithRepo(mock)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", role)
	destStr := testDestID.String()
	ctx.Set("destination_id", &destStr)
	ctx.Set("permissions", struct {
		AccessScope             string
		CanWriteValues          bool
		CanManageUsers          bool
		CanApproveGoodPractices bool
		EvaluationTypes         []string
	}{
		AccessScope: "destination",
	})

	return uc, mock, ctx, rec
}

func createTestPlan(status domain.DtiPlanStatus) *domain.DtiPlan {
	now := time.Now()
	return &domain.DtiPlan{
		ID:            testPlanID,
		DestinationID: testDestID,
		Name:          "Test DTI Plan 2025",
		StartDate:     now,
		EndDate:       now.AddDate(1, 0, 0),
		Status:        status,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1d.6 — DtiPlan CRUD Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleCreateDtiPlan_GestorDestino_Success(t *testing.T) {
	uc, mock, ctx, rec := setupDtiPlanTest(t, "gestor_destino")

	body := `{"name":"Plan 2025","start_date":"2025-01-01","end_date":"2025-12-31"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleCreateDtiPlan(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if rec.Code != http.StatusCreated && rec.Code != 0 {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	// Verify it was stored with activo status
	found := false
	for _, p := range mock.dtiPlans {
		if p.Name == "Plan 2025" && p.Status == domain.DtiPlanStatusActivo {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected dti plan to be stored with status activo")
	}
}

func TestHandleCreateDtiPlan_Consultor_Forbidden(t *testing.T) {
	uc, _, ctx, _ := setupDtiPlanTest(t, "consultor")

	body := `{"name":"Plan 2025","start_date":"2025-01-01","end_date":"2025-12-31"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleCreateDtiPlan(ctx)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", httpErr.Code)
	}
}

func TestHandleListDtiPlans_ByDestination(t *testing.T) {
	uc, mock, _, _ := setupDtiPlanTest(t, "consultor")

	// Add a plan to mock
	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?destination_id="+testDestID.String(), nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "consultor")

	err := uc.HandleListDtiPlans(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	var plans []*domain.DtiPlan
	if err := json.Unmarshal(rec.Body.Bytes(), &plans); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(plans) == 0 {
		t.Fatal("expected at least 1 plan")
	}
	if plans[0].Name != "Test DTI Plan 2025" {
		t.Errorf("expected 'Test DTI Plan 2025', got %q", plans[0].Name)
	}
}

func TestHandleUpdateDtiPlan_Success(t *testing.T) {
	uc, mock, ctx, rec := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())

	body := `{"name":"Updated Plan","start_date":"2025-06-01","end_date":"2025-12-31"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleUpdateDtiPlan(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if rec.Code != http.StatusOK && rec.Code != 0 {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	updated, ok := mock.dtiPlans[testPlanID]
	if !ok {
		t.Fatal("expected plan to exist")
	}
	if updated.Name != "Updated Plan" {
		t.Errorf("expected 'Updated Plan', got %q", updated.Name)
	}
}

func TestHandleDeleteDtiPlan_NoGoals_Success(t *testing.T) {
	uc, mock, ctx, _ := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())
	req := httptest.NewRequest(http.MethodDelete, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleDeleteDtiPlan(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if _, exists := mock.dtiPlans[testPlanID]; exists {
		t.Error("expected plan to be deleted")
	}
}

func TestHandleDeleteDtiPlan_WithGoals_Error(t *testing.T) {
	uc, mock, ctx, _ := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)
	// Add a goal
	mock.dtiPlanGoals[testGoalID] = &domain.DtiPlanGoal{
		ID:          testGoalID,
		DtiPlanID:   testPlanID,
		IndicatorID: uuid.New(),
		TargetScore: 75,
	}

	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())
	req := httptest.NewRequest(http.MethodDelete, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleDeleteDtiPlan(ctx)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d", httpErr.Code)
	}
}

func TestHandleCloseDtiPlan_Success(t *testing.T) {
	uc, mock, ctx, rec := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())

	body := `{"status":"cerrado"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleUpdateDtiPlan(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if rec.Code != http.StatusOK && rec.Code != 0 {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	updated := mock.dtiPlans[testPlanID]
	if updated.Status != domain.DtiPlanStatusCerrado {
		t.Errorf("expected status cerrado, got %q", updated.Status)
	}
}

func TestHandleCloseDtiPlan_Reopen_Fails(t *testing.T) {
	uc, mock, ctx, _ := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusCerrado)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())

	body := `{"status":"activo"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleUpdateDtiPlan(ctx)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422, got %d", httpErr.Code)
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1d.2 — DtiPlanGoal Management Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleAddDtiPlanGoal_Success(t *testing.T) {
	uc, mock, ctx, _ := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())

	indicatorID := uuid.New()
	body := `{"indicator_id":"` + indicatorID.String() + `","target_score":80,"target_date":"2025-06-30"}`
	req := httptest.NewRequest(http.MethodPost, "/goals", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleAddDtiPlanGoal(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	goals, _ := mock.ListDtiPlanGoals(ctx.Request().Context(), testPlanID)
	if len(goals) != 1 {
		t.Fatalf("expected 1 goal, got %d", len(goals))
	}
	if goals[0].TargetScore != 80 {
		t.Errorf("expected target_score 80, got %d", goals[0].TargetScore)
	}
}

func TestHandleListDtiPlanGoals_Empty(t *testing.T) {
	uc, mock, ctx, rec := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testPlanID.String())
	req := httptest.NewRequest(http.MethodGet, "/goals", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleListDtiPlanGoals(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	var goals []*domain.DtiPlanGoal
	if err := json.Unmarshal(rec.Body.Bytes(), &goals); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(goals) != 0 {
		t.Errorf("expected 0 goals, got %d", len(goals))
	}
}

func TestHandleRemoveDtiPlanGoal_Success(t *testing.T) {
	uc, mock, ctx, _ := setupDtiPlanTest(t, "gestor_destino")

	mock.dtiPlans[testPlanID] = createTestPlan(domain.DtiPlanStatusActivo)
	mock.dtiPlanGoals[testGoalID] = &domain.DtiPlanGoal{
		ID:          testGoalID,
		DtiPlanID:   testPlanID,
		IndicatorID: uuid.New(),
		TargetScore: 75,
	}

	ctx.SetParamNames("id", "goalId")
	ctx.SetParamValues(testPlanID.String(), testGoalID.String())
	req := httptest.NewRequest(http.MethodDelete, "/goals/"+testGoalID.String(), nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleRemoveDtiPlanGoal(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	goals, _ := mock.ListDtiPlanGoals(ctx.Request().Context(), testPlanID)
	if len(goals) != 0 {
		t.Errorf("expected 0 goals, got %d", len(goals))
	}
}
