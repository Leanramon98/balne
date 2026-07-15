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

var testActionID = uuid.MustParse("33333333-3333-3333-3333-333333333333")
var testIndicatorID = uuid.MustParse("44444444-4444-4444-4444-444444444444")

// ── Test Helpers ──────────────────────────────────────────────────────

func createTestAction(status domain.ActionStatus) *domain.Action {
	now := time.Now()
	return &domain.Action{
		ID:            testActionID,
		DestinationID: testDestID,
		Name:          "Test Action",
		Summary:       strPtr("Test summary"),
		Objective:     strPtr("Test objective"),
		Status:        status,
		BudgetCurrency: "EUR",
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

func strPtr(s string) *string {
	return &s
}

func setupActionTest(t *testing.T, role string, userID uuid.UUID) (*Logic, *mockRepo, echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	mock := newMockRepo()
	uc := NewLogicWithRepo(mock)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	ctx.Set("user_id", userID.String())
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

func setupCtxWithPerms(t *testing.T, role string, userID uuid.UUID, canApproveGP bool) (*Logic, *mockRepo, echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	mock := newMockRepo()
	uc := NewLogicWithRepo(mock)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	ctx.Set("user_id", userID.String())
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
		AccessScope:             "destination",
		CanApproveGoodPractices: canApproveGP,
	})

	return uc, mock, ctx, rec
}

// ═════════════════════════════════════════════════════════════════════
// 1c.1 — Action CRUD Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleCreateAction_GestorDestino_Success(t *testing.T) {
	uc, mock, ctx, rec := setupActionTest(t, "gestor_destino", testDestUserID)

	ctx.SetParamNames("destination_id")
	ctx.SetParamValues(testDestID.String())
	body := `{"name":"New Action","summary":"A summary","objective":"An objective"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleCreateAction(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if rec.Code != http.StatusCreated && rec.Code != 0 {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	// Verify it was stored
	found := false
	for _, a := range mock.actions {
		if a.Name == "New Action" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected action to be stored in mock")
	}
}

func TestHandleCreateAction_Consultor_Forbidden(t *testing.T) {
	uc, _, ctx, _ := setupActionTest(t, "consultor", testDestUserID)

	body := `{"name":"New Action","summary":"A summary","objective":"An objective"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleCreateAction(ctx)
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

func TestHandleListActions_ReturnsActions(t *testing.T) {
	uc, mock, _, _ := setupActionTest(t, "consultor", testDestUserID)

	// Set up actions in mock
	a := createTestAction(domain.ActionStatusIdea)
	mock.actions[a.ID] = a

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?destination_id="+testDestID.String(), nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "consultor")

	err := uc.HandleListActions(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	var actions []*domain.Action
	if err := json.Unmarshal(rec.Body.Bytes(), &actions); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(actions) == 0 {
		t.Fatal("expected at least 1 action")
	}
	if actions[0].Name != "Test Action" {
		t.Errorf("expected 'Test Action', got %q", actions[0].Name)
	}
}

func TestHandleGetAction_Found(t *testing.T) {
	uc, mock, ctx, rec := setupActionTest(t, "consultor", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusIdea)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())

	err := uc.HandleGetAction(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	var action domain.Action
	if err := json.Unmarshal(rec.Body.Bytes(), &action); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if action.Name != "Test Action" {
		t.Errorf("expected 'Test Action', got %q", action.Name)
	}
}

func TestHandleGetAction_NotFound(t *testing.T) {
	uc, _, ctx, _ := setupActionTest(t, "consultor", testDestUserID)

	ctx.SetParamNames("id")
	ctx.SetParamValues(uuid.New().String())

	err := uc.HandleGetAction(ctx)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", httpErr.Code)
	}
}

func TestHandleDeleteAction_AdminDestino_Success(t *testing.T) {
	uc, mock, ctx, _ := setupActionTest(t, "admin_destino", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusIdea)
	setCtxPermsCanApprove(ctx, true)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())

	err := uc.HandleDeleteAction(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if _, exists := mock.actions[testActionID]; exists {
		t.Error("expected action to be deleted")
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1c.2 — ActionEvidence Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleAddActionEvidence_Success(t *testing.T) {
	uc, mock, ctx, _ := setupActionTest(t, "gestor_destino", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusEnEjecucion)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	body := `{"evaluation_id":"` + testEvalID.String() + `","type":"url","url":"https://example.com/doc"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleAddActionEvidence(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Check evidence stored
	evidence, _ := mock.ListActionEvidence(ctx.Request().Context(), testActionID)
	if len(evidence) != 1 {
		t.Fatalf("expected 1 evidence, got %d", len(evidence))
	}
	if evidence[0].Type != domain.EvidenceTypeURL {
		t.Errorf("expected url type, got %q", evidence[0].Type)
	}
	if evidence[0].URL == nil || *evidence[0].URL != "https://example.com/doc" {
		t.Errorf("expected url https://example.com/doc, got %v", evidence[0].URL)
	}
}

func TestHandleListActionEvidence_ReturnsEvidence(t *testing.T) {
	uc, mock, ctx, rec := setupActionTest(t, "gestor_destino", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusEnEjecucion)
	ev := &domain.ActionEvidence{
		ID:           uuid.New(),
		ActionID:     testActionID,
		EvaluationID: testEvalID,
		Type:         domain.EvidenceTypeDocument,
		URL:          nil,
		FilePath:     strPtr("/uploads/doc.pdf"),
		CreatedAt:    time.Now(),
	}
	mock.evidence[ev.ID] = ev

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())

	err := uc.HandleListActionEvidence(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	var evidence []*domain.ActionEvidence
	if err := json.Unmarshal(rec.Body.Bytes(), &evidence); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(evidence) != 1 {
		t.Fatalf("expected 1 evidence, got %d", len(evidence))
	}
	if evidence[0].Type != domain.EvidenceTypeDocument {
		t.Errorf("expected document type, got %q", evidence[0].Type)
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1c.3 — ActionIndicatorLink Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleLinkIndicator_Success(t *testing.T) {
	uc, mock, ctx, _ := setupActionTest(t, "gestor_destino", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusEnEjecucion)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	body := `{"indicator_id":"` + testIndicatorID.String() + `","evaluation_id":"` + testEvalID.String() + `"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleLinkIndicator(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	links, _ := mock.ListActionIndicatorLinks(ctx.Request().Context(), testActionID)
	if len(links) != 1 {
		t.Fatalf("expected 1 link, got %d", len(links))
	}
	if links[0].ActionStatusAtLink != domain.ActionStatusEnEjecucion {
		t.Errorf("expected status snapshot EnEjecucion, got %q", links[0].ActionStatusAtLink)
	}
	if links[0].IndicatorID != testIndicatorID {
		t.Errorf("expected indicator %s, got %s", testIndicatorID, links[0].IndicatorID)
	}
}

func TestHandleUnlinkIndicator_Success(t *testing.T) {
	uc, mock, ctx, _ := setupActionTest(t, "gestor_destino", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusEnEjecucion)
	link := &domain.ActionIndicatorLink{
		ID:                uuid.New(),
		ActionID:          testActionID,
		IndicatorID:       testIndicatorID,
		EvaluationID:      testEvalID,
		ActionStatusAtLink: domain.ActionStatusEnEjecucion,
		CreatedAt:         time.Now(),
	}
	mock.links[link.ID] = link

	ctx.SetParamNames("id", "indicatorId", "evaluationId")
	ctx.SetParamValues(testActionID.String(), testIndicatorID.String(), testEvalID.String())

	err := uc.HandleUnlinkIndicator(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Verify link was deleted
	links, _ := mock.ListActionIndicatorLinks(ctx.Request().Context(), testActionID)
	if len(links) != 0 {
		t.Errorf("expected 0 links after unlink, got %d", len(links))
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1c.7 — GoodPractice Lifecycle Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleDesignateGoodPractice_Consultor_Success(t *testing.T) {
	uc, mock, ctx, _ := setupActionTest(t, "consultor", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusFinalizada)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	req := httptest.NewRequest(http.MethodPut, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleDesignateGoodPractice(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	gp, err := mock.FindGoodPracticeByActionID(ctx.Request().Context(), testActionID)
	if err != nil {
		t.Fatalf("expected good practice to exist: %v", err)
	}
	if gp.Status != domain.GpStatusDesignated {
		t.Errorf("expected status designated, got %q", gp.Status)
	}
	if gp.DesignatedBy != testDestUserID {
		t.Errorf("expected designated_by %s, got %s", testDestUserID, gp.DesignatedBy)
	}
}

func TestHandleDesignateGoodPractice_Auditor_Success(t *testing.T) {
	uc, mock, ctx, _ := setupActionTest(t, "auditor", testDestUserID)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusFinalizada)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	req := httptest.NewRequest(http.MethodPut, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleDesignateGoodPractice(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	gp, err := mock.FindGoodPracticeByActionID(ctx.Request().Context(), testActionID)
	if err != nil {
		t.Fatalf("expected good practice to exist: %v", err)
	}
	if gp.Status != domain.GpStatusDesignated {
		t.Errorf("expected status designated, got %q", gp.Status)
	}
}

func TestHandleDesignateGoodPractice_GestorDestino_Forbidden(t *testing.T) {
	uc, _, ctx, _ := setupActionTest(t, "gestor_destino", testDestUserID)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())

	err := uc.HandleDesignateGoodPractice(ctx)
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

func TestHandleDesignateGoodPractice_Admin_Forbidden(t *testing.T) {
	uc, _, ctx, _ := setupActionTest(t, "admin", testDestUserID)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())

	err := uc.HandleDesignateGoodPractice(ctx)
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

func TestHandleApproveGoodPractice_AdminDestino_Success(t *testing.T) {
	uc, mock, ctx, _ := setupCtxWithPerms(t, "admin_destino", testDestUserID, true)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusFinalizada)
	// Pre-designate
	now := time.Now()
	mock.goodPractices[testActionID] = &domain.GoodPractice{
		ID:           uuid.New(),
		ActionID:     testActionID,
		DesignatedBy: testDestUserID,
		DesignatedAt: now,
		Status:       domain.GpStatusDesignated,
	}

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	body := `{"action":"approve"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleApproveGoodPractice(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	gp, _ := mock.FindGoodPracticeByActionID(ctx.Request().Context(), testActionID)
	if gp.Status != domain.GpStatusApproved {
		t.Errorf("expected status approved, got %q", gp.Status)
	}
	if gp.ApprovedBy == nil || *gp.ApprovedBy != testDestUserID {
		t.Errorf("expected approved_by %s", testDestUserID)
	}
}

func TestHandleRejectGoodPractice_AdminDestino_Success(t *testing.T) {
	uc, mock, ctx, _ := setupCtxWithPerms(t, "admin_destino", testDestUserID, true)

	mock.actions[testActionID] = createTestAction(domain.ActionStatusFinalizada)
	now := time.Now()
	mock.goodPractices[testActionID] = &domain.GoodPractice{
		ID:           uuid.New(),
		ActionID:     testActionID,
		DesignatedBy: testDestUserID,
		DesignatedAt: now,
		Status:       domain.GpStatusDesignated,
	}

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	body := `{"action":"reject"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleApproveGoodPractice(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	gp, _ := mock.FindGoodPracticeByActionID(ctx.Request().Context(), testActionID)
	if gp.Status != domain.GpStatusRejected {
		t.Errorf("expected status rejected, got %q", gp.Status)
	}
}

func TestHandleApproveGoodPractice_NonAdminDestino_Forbidden(t *testing.T) {
	uc, _, ctx, _ := setupCtxWithPerms(t, "gestor_destino", testDestUserID, false)

	ctx.SetParamNames("id")
	ctx.SetParamValues(testActionID.String())
	body := `{"action":"approve"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleApproveGoodPractice(ctx)
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

// ═════════════════════════════════════════════════════════════════════
// Phase 9.1 — TDD: HandleGetActionEvidence
// ═════════════════════════════════════════════════════════════════════

func setupEvidenceAccessTest(t *testing.T, role string, userID uuid.UUID, evalID uuid.UUID, hasAccess bool) (*Logic, *mockRepo, echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	mock := newMockRepo()
	uc := NewLogicWithRepo(mock)
	eval := &domain.Evaluation{
		ID: evalID, Name: "Test Evaluation", Status: domain.EvaluationStatusBorrador,
		DestinationID: testDestID, CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	mock.evaluations[evalID] = eval
	if hasAccess {
		mock.accessEntries[evalID.String()+":"+userID.String()] = domain.AccessLevelSoloLectura
	}
	mock.users[userID.String()] = struct{}{}
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", userID.String())
	ctx.Set("role", role)
	destStr := testDestID.String()
	ctx.Set("destination_id", &destStr)
	ctx.Set("permissions", struct {
		AccessScope             string
		CanWriteValues          bool
		CanManageUsers          bool
		CanApproveGoodPractices bool
		EvaluationTypes         []string
	}{AccessScope: "global"})
	return uc, mock, ctx, rec
}

func TestHandleGetActionEvidence_Found_WithAccess(t *testing.T) {
	evalID, actionID, userID, evidenceID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	uc, mock, ctx, rec := setupEvidenceAccessTest(t, "gestor_destino", userID, evalID, true)
	mock.evidence[evidenceID] = &domain.ActionEvidence{
		ID: evidenceID, ActionID: actionID, EvaluationID: evalID,
		Type: domain.EvidenceTypeDocument, FilePath: strPtr("test.pdf"), CreatedAt: time.Now(),
	}
	ctx.SetParamNames("id")
	ctx.SetParamValues(evidenceID.String())
	if err := uc.HandleGetActionEvidence(ctx); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var resp domain.ActionEvidence
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.ID != evidenceID || resp.Type != domain.EvidenceTypeDocument {
		t.Errorf("evidence data mismatch")
	}
}

func TestHandleGetActionEvidence_Found_NoAccess(t *testing.T) {
	evalID, actionID, userID, evidenceID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	uc, mock, ctx, _ := setupEvidenceAccessTest(t, "gestor_destino", userID, evalID, false)
	mock.evidence[evidenceID] = &domain.ActionEvidence{
		ID: evidenceID, ActionID: actionID, EvaluationID: evalID,
		Type: domain.EvidenceTypeDocument, FilePath: strPtr("test.pdf"), CreatedAt: time.Now(),
	}
	ctx.SetParamNames("id")
	ctx.SetParamValues(evidenceID.String())
	err := uc.HandleGetActionEvidence(ctx)
	if err == nil {
		t.Fatal("expected 403, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok || httpErr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %v", err)
	}
}

func TestHandleGetActionEvidence_AdminAlwaysAccess(t *testing.T) {
	evalID, actionID, userID, evidenceID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	uc, mock, ctx, rec := setupEvidenceAccessTest(t, "admin", userID, evalID, false)
	mock.evidence[evidenceID] = &domain.ActionEvidence{
		ID: evidenceID, ActionID: actionID, EvaluationID: evalID,
		Type: domain.EvidenceTypeDocument, FilePath: strPtr("test.pdf"), CreatedAt: time.Now(),
	}
	ctx.SetParamNames("id")
	ctx.SetParamValues(evidenceID.String())
	if err := uc.HandleGetActionEvidence(ctx); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHandleGetActionEvidence_NotFound(t *testing.T) {
	evalID, userID := uuid.New(), uuid.New()
	uc, _, ctx, _ := setupEvidenceAccessTest(t, "admin", userID, evalID, false)
	ctx.SetParamNames("id")
	ctx.SetParamValues(uuid.New().String())
	err := uc.HandleGetActionEvidence(ctx)
	if err == nil {
		t.Fatal("expected 404, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok || httpErr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %v", err)
	}
}

func TestHandleGetActionEvidence_InvalidID(t *testing.T) {
	evalID, userID := uuid.New(), uuid.New()
	uc, _, ctx, _ := setupEvidenceAccessTest(t, "admin", userID, evalID, false)
	ctx.SetParamNames("id")
	ctx.SetParamValues("not-a-uuid")
	err := uc.HandleGetActionEvidence(ctx)
	if err == nil {
		t.Fatal("expected 400, got nil")
	}
	httpErr, ok := err.(*echo.HTTPError)
	if !ok || httpErr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %v", err)
	}
}
