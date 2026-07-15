package usecases

import (
	"context"
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

// ═════════════════════════════════════════════════════════════════════
// 1e.8 — TDD: AI Field Visibility
// ═════════════════════════════════════════════════════════════════════

func TestFilterIndicatorValue_AnalisisIA_VisibleToAll(t *testing.T) {
	analysis := "Análisis automático completado"
	suggestions := "Mejora la accesibilidad web"
	iv := &domain.IndicatorValue{
		ID:                  uuid.New(),
		AnalisisIA:          &analysis,
		SugerenciasMejoraIA: &suggestions,
	}

	// carga user should see analisis_ia but NOT sugerencias_mejora_ia
	filtered := FilterIndicatorValueResponse(iv, "gestor_destino", domain.AccessLevelCarga)
	if filtered.AnalisisIA == nil || *filtered.AnalisisIA != analysis {
		t.Error("carga user should see AnalisisIA")
	}
	if filtered.SugerenciasMejoraIA != nil {
		t.Error("carga user should NOT see SugerenciasMejoraIA")
	}
}

func TestFilterIndicatorValue_Evaluador_SeesBothFields(t *testing.T) {
	analysis := "Análisis completado"
	suggestions := "Sugerencia de mejora"
	iv := &domain.IndicatorValue{
		ID:                  uuid.New(),
		AnalisisIA:          &analysis,
		SugerenciasMejoraIA: &suggestions,
	}

	// evaluador should see both
	filtered := FilterIndicatorValueResponse(iv, "consultor", domain.AccessLevelEvaluador)
	if filtered.AnalisisIA == nil || *filtered.AnalisisIA != analysis {
		t.Error("evaluador user should see AnalisisIA")
	}
	if filtered.SugerenciasMejoraIA == nil || *filtered.SugerenciasMejoraIA != suggestions {
		t.Error("evaluador user should see SugerenciasMejoraIA")
	}
}

func TestFilterIndicatorValue_SoloLectura_SeesOnlyAnalisisIA(t *testing.T) {
	analysis := "Análisis público"
	suggestions := "Sugerencia privada"
	iv := &domain.IndicatorValue{
		ID:                  uuid.New(),
		AnalisisIA:          &analysis,
		SugerenciasMejoraIA: &suggestions,
	}

	filtered := FilterIndicatorValueResponse(iv, "gestor_destino", domain.AccessLevelSoloLectura)
	if filtered.AnalisisIA == nil || *filtered.AnalisisIA != analysis {
		t.Error("solo_lectura user should see AnalisisIA")
	}
	if filtered.SugerenciasMejoraIA != nil {
		t.Error("solo_lectura user should NOT see SugerenciasMejoraIA")
	}
}

func TestFilterIndicatorValue_Admin_SeesBothFields(t *testing.T) {
	analysis := "Admin analysis"
	suggestions := "Admin suggestions"
	iv := &domain.IndicatorValue{
		ID:                  uuid.New(),
		AnalisisIA:          &analysis,
		SugerenciasMejoraIA: &suggestions,
	}

	filtered := FilterIndicatorValueResponse(iv, "admin", "")
	if filtered.AnalisisIA == nil || *filtered.AnalisisIA != analysis {
		t.Error("admin should see AnalisisIA")
	}
	if filtered.SugerenciasMejoraIA == nil || *filtered.SugerenciasMejoraIA != suggestions {
		t.Error("admin should see SugerenciasMejoraIA")
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1e.8 — TDD: AI Field Visibility via HTTP Handler
// ═════════════════════════════════════════════════════════════════════

func TestHandleGetIndicatorValue_AnalisisIA_FilteredByRole(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()
	ivID := uuid.New()
	analysis := "AI analysis text"
	suggestions := "AI suggestions text"

	// Set up evaluation
	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	// Set up indicator
	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_01",
		Name: "Test Indicator",
		Type: domain.IndicatorTypeGradient,
	}

	// Set up indicator value with AI fields
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:                  ivID,
		IndicatorID:         indicatorID,
		EvaluationID:        evalID,
		DestinationValue:    intPtr(50),
		AnalisisIA:          &analysis,
		SugerenciasMejoraIA: &suggestions,
	}

	t.Run("carga user sees only analisis_ia", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.Set("user_id", testDestUserID.String())
		ctx.Set("role", "gestor_destino")
		ctx.SetParamNames("evaluationId", "id")
		ctx.SetParamValues(evalID.String(), indicatorID.String())

		// Grant carga access
		_ = mock.GrantAccess(context.Background(), evalID, testDestUserID, domain.AccessLevelCarga)

		err := uc.HandleGetIndicatorValue(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		var resp domain.IndicatorValue
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if resp.AnalisisIA == nil || *resp.AnalisisIA != analysis {
			t.Error("carga user should see AnalisisIA")
		}
		if resp.SugerenciasMejoraIA != nil {
			t.Error("carga user should NOT see SugerenciasMejoraIA")
		}
	})

	t.Run("evaluador user sees both fields", func(t *testing.T) {
		evalUserID := uuid.New()

		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.Set("user_id", evalUserID.String())
		ctx.Set("role", "consultor")
		ctx.SetParamNames("evaluationId", "id")
		ctx.SetParamValues(evalID.String(), indicatorID.String())

		// Grant evaluador access
		_ = mock.GrantAccess(context.Background(), evalID, evalUserID, domain.AccessLevelEvaluador)

		err := uc.HandleGetIndicatorValue(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		var resp domain.IndicatorValue
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if resp.AnalisisIA == nil || *resp.AnalisisIA != analysis {
			t.Error("evaluador user should see AnalisisIA")
		}
		if resp.SugerenciasMejoraIA == nil || *resp.SugerenciasMejoraIA != suggestions {
			t.Error("evaluador user should see SugerenciasMejoraIA")
		}
	})

	t.Run("admin user sees both fields", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.Set("user_id", testAdminUserID.String())
		ctx.Set("role", "admin")
		ctx.SetParamNames("evaluationId", "id")
		ctx.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleGetIndicatorValue(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		var resp domain.IndicatorValue
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if resp.AnalisisIA == nil || *resp.AnalisisIA != analysis {
			t.Error("admin should see AnalisisIA")
		}
		if resp.SugerenciasMejoraIA == nil || *resp.SugerenciasMejoraIA != suggestions {
			t.Error("admin should see SugerenciasMejoraIA")
		}
	})

	t.Run("unauthenticated returns 401", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		// No user_id set — unauthenticated
		ctx.SetParamNames("evaluationId", "id")
		ctx.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleGetIndicatorValue(ctx)
		if err == nil {
			t.Fatal("expected error for unauthenticated user")
		}
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T", err)
		}
		if httpErr.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", httpErr.Code)
		}
	})
}

// ═════════════════════════════════════════════════════════════════════
// 1e.9 — TDD: Indicator Value History
// ═════════════════════════════════════════════════════════════════════

func TestHandleSaveDestinationValue_CreatesHistoryEntry(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	// Set up evaluation in en_curso
	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	// Set up indicator with gradient type
	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_01",
		Name: "Test Indicator",
		Type: domain.IndicatorTypeGradient,
	}

	// No existing indicator value — will be created

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"destination_value":50}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	// Grant carga access (gestor_destino owns it)
	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify an indicator value was created
	if len(mock.ivMap) == 0 {
		t.Fatal("expected indicator value to be created")
	}

	// Find the created IV
	var createdIV *domain.IndicatorValue
	for _, iv := range mock.ivMap {
		if iv.IndicatorID == indicatorID && iv.EvaluationID == evalID {
			createdIV = iv
			break
		}
	}
	if createdIV == nil {
		t.Fatal("expected indicator value for this eval+indicator")
	}
	if createdIV.DestinationValue == nil || *createdIV.DestinationValue != 50 {
		t.Errorf("expected destination_value 50, got %v", createdIV.DestinationValue)
	}

	// Verify a history entry was created
	if len(mock.indicatorHistory) == 0 {
		t.Error("expected at least one history entry to be created")
	}
}

func TestHandleSaveDestinationValue_UpdateCreatesAnotherHistoryEntry(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()
	ivID := uuid.New()

	// Set up
	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_01",
		Name: "Test Indicator",
		Type: domain.IndicatorTypeGradient,
	}

	// Pre-create an indicator value
	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:               ivID,
		IndicatorID:      indicatorID,
		EvaluationID:     evalID,
		DestinationValue: intPtr(25),
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	// Count history before update
	historyBefore := len(mock.indicatorHistory)

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"destination_value":75}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify a new history entry was created
	if len(mock.indicatorHistory) <= historyBefore {
		t.Error("expected a new history entry after update")
	}
}

func TestHandleDeleteDestinationValue_KeepsHistory(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()
	ivID := uuid.New()

	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_01",
		Name: "Test Indicator",
		Type: domain.IndicatorTypeGradient,
	}

	now := time.Now()

	// Pre-create IV with value
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:               ivID,
		IndicatorID:      indicatorID,
		EvaluationID:     evalID,
		DestinationValue: intPtr(50),
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	// Pre-create a history entry
	historyID := uuid.New()
	mock.indicatorHistory[historyID] = &domain.IndicatorHistory{
		ID:               historyID,
		IndicatorValueID: ivID,
		DestinationValue: intPtr(25),
		Source:           "manual",
		CreatedAt:        now,
	}

	historyBefore := len(mock.indicatorHistory)

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	req := httptest.NewRequest(http.MethodDelete, "/", nil)
	ctx.SetRequest(req)

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleDeleteDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// History should still exist
	if len(mock.indicatorHistory) != historyBefore {
		t.Errorf("expected %d history entries, got %d", historyBefore, len(mock.indicatorHistory))
	}
}

func TestHandleSaveDestinationValue_TypeValidation_Gradient(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_01",
		Name: "Test Gradient",
		Type: domain.IndicatorTypeGradient,
	}

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)

	t.Run("valid gradient value 50", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":50}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx2 := e.NewContext(req, rec)
		ctx2.Set("user_id", testAdminUserID.String())
		ctx2.Set("role", "gestor_destino")
		ctx2.SetParamNames("evaluationId", "id")
		ctx2.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleSaveDestinationValue(ctx2)
		if err != nil {
			t.Fatalf("expected success, got: %v", err)
		}
	})

	t.Run("invalid gradient value 150", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":150}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx2 := e.NewContext(req, rec)
		ctx2.Set("user_id", testAdminUserID.String())
		ctx2.Set("role", "gestor_destino")
		ctx2.SetParamNames("evaluationId", "id")
		ctx2.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleSaveDestinationValue(ctx2)
		if err == nil {
			t.Fatal("expected error for invalid gradient value")
		}
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T", err)
		}
		if httpErr.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", httpErr.Code)
		}
	})
}

func TestHandleSaveDestinationValue_TypeValidation_Boolean(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_02",
		Name: "Test Boolean",
		Type: domain.IndicatorTypeBoolean,
	}

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)

	t.Run("valid boolean 1", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":1}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx2 := e.NewContext(req, rec)
		ctx2.Set("user_id", testAdminUserID.String())
		ctx2.Set("role", "gestor_destino")
		ctx2.SetParamNames("evaluationId", "id")
		ctx2.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleSaveDestinationValue(ctx2)
		if err != nil {
			t.Fatalf("expected success, got: %v", err)
		}
	})

	t.Run("invalid boolean 2", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":2}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx2 := e.NewContext(req, rec)
		ctx2.Set("user_id", testAdminUserID.String())
		ctx2.Set("role", "gestor_destino")
		ctx2.SetParamNames("evaluationId", "id")
		ctx2.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleSaveDestinationValue(ctx2)
		if err == nil {
			t.Fatal("expected error for invalid boolean value")
		}
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T", err)
		}
		if httpErr.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", httpErr.Code)
		}
	})
}

func TestHandleSaveDestinationValue_TypeValidation_Numeric(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_03",
		Name: "Test Numeric",
		Type: domain.IndicatorTypeNumeric,
	}

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)

	t.Run("valid numeric 5", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":5}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx2 := e.NewContext(req, rec)
		ctx2.Set("user_id", testAdminUserID.String())
		ctx2.Set("role", "gestor_destino")
		ctx2.SetParamNames("evaluationId", "id")
		ctx2.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleSaveDestinationValue(ctx2)
		if err != nil {
			t.Fatalf("expected success, got: %v", err)
		}
	})

	t.Run("invalid numeric -1", func(t *testing.T) {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":-1}`))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		ctx2 := e.NewContext(req, rec)
		ctx2.Set("user_id", testAdminUserID.String())
		ctx2.Set("role", "gestor_destino")
		ctx2.SetParamNames("evaluationId", "id")
		ctx2.SetParamValues(evalID.String(), indicatorID.String())

		err := uc.HandleSaveDestinationValue(ctx2)
		if err == nil {
			t.Fatal("expected error for negative numeric value")
		}
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T", err)
		}
		if httpErr.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", httpErr.Code)
		}
	})
}

// ═════════════════════════════════════════════════════════════════════
// 1e.3 — Message creation tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleCreateIndicatorMessage_SetsUserID(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	ivID := uuid.New()

	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:        ivID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	ctx.SetParamNames("indicatorValueId")
	ctx.SetParamValues(ivID.String())
	reqBody := `{"message":"Test message for indicator"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleCreateIndicatorMessage(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify the message was created
	if len(mock.indicatorMessages) == 0 {
		t.Fatal("expected message to be created")
	}

	var createdMsg *domain.IndicatorMessage
	for _, msg := range mock.indicatorMessages {
		if msg.IndicatorValueID == ivID {
			createdMsg = msg
			break
		}
	}
	if createdMsg == nil {
		t.Fatal("expected message for this indicator value")
	}
	if createdMsg.UserID != testAdminUserID {
		t.Errorf("expected user_id %s, got %s", testAdminUserID, createdMsg.UserID)
	}
	if createdMsg.Message != "Test message for indicator" {
		t.Errorf("expected message 'Test message for indicator', got %q", createdMsg.Message)
	}
}

func TestHandleListIndicatorMessages_ReturnsMessages(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	ivID := uuid.New()
	now := time.Now()

	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:        ivID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Create some messages
	msg1 := &domain.IndicatorMessage{
		ID:               uuid.New(),
		IndicatorValueID: ivID,
		UserID:           uuid.New(),
		Message:          "First message",
		CreatedAt:        now,
	}
	msg2 := &domain.IndicatorMessage{
		ID:               uuid.New(),
		IndicatorValueID: ivID,
		UserID:           uuid.New(),
		Message:          "Second message",
		CreatedAt:        now.Add(time.Second),
	}
	mock.indicatorMessages[msg1.ID] = msg1
	mock.indicatorMessages[msg2.ID] = msg2

	ctx.SetParamNames("indicatorValueId")
	ctx.SetParamValues(ivID.String())

	err := uc.HandleListIndicatorMessages(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	rec := ctx.Response().Writer.(*httptest.ResponseRecorder)
	var messages []*domain.IndicatorMessage
	if err := json.Unmarshal(rec.Body.Bytes(), &messages); err != nil {
		t.Fatalf("unmarshal messages: %v", err)
	}
	if len(messages) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(messages))
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1e.2 — Delete value test
// ═════════════════════════════════════════════════════════════════════

func TestHandleDeleteDestinationValue_ResetsValue(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()
	ivID := uuid.New()

	mock.evaluations[evalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.evaluations[evalID].DestinationID = testDestID

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_01",
		Name: "Test",
		Type: domain.IndicatorTypeGradient,
	}

	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:               ivID,
		IndicatorID:      indicatorID,
		EvaluationID:     evalID,
		DestinationValue: intPtr(75),
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	req := httptest.NewRequest(http.MethodDelete, "/", nil)
	ctx.SetRequest(req)

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleDeleteDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify value was reset
	updatedIV, _ := mock.FindIndicatorValueByID(context.Background(), ivID)
	if updatedIV.DestinationValue != nil {
		t.Error("expected destination_value to be nil after delete")
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1e.5 — AI analysis stub test
// ═════════════════════════════════════════════════════════════════════

func TestHandleTriggerAIAnalysis_Returns202(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	ivID := uuid.New()
	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:        ivID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	ctx.SetParamNames("id")
	ctx.SetParamValues(ivID.String())

	err := uc.HandleTriggerAIAnalysis(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Sync stub returns 200 OK (would be 202 Accepted when async via RabbitMQ)
	rec := ctx.Response().Writer.(*httptest.ResponseRecorder)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHandleTriggerAIAnalysis_Sync_SetsMockValues(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	ivID := uuid.New()
	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:        ivID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	ctx.SetParamNames("id")
	ctx.SetParamValues(ivID.String())
	req := httptest.NewRequest(http.MethodPost, "/?sync=true", nil)
	ctx.SetRequest(req)

	err := uc.HandleTriggerAIAnalysis(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// In sync mode, AI fields should be set
	updatedIV := mock.ivMap[ivID]
	if updatedIV.AnalisisIA == nil || *updatedIV.AnalisisIA == "" {
		t.Error("expected AnalisisIA to be set in sync mode")
	}
	if updatedIV.SugerenciasMejoraIA == nil || *updatedIV.SugerenciasMejoraIA == "" {
		t.Error("expected SugerenciasMejoraIA to be set in sync mode")
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1e.10 — Auto-transition borrador → en_curso
// ═════════════════════════════════════════════════════════════════════

func TestHandleSaveDestinationValue_AutoTransition_FromBorradorToEnCurso(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	// Set up evaluation in borrador with nil StartDate
	e := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e.ID = evalID
	e.StartDate = nil
	mock.evaluations[evalID] = e

	// Set up indicator
	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_TRANS_01",
		Name: "Auto-Transition Test",
		Type: domain.IndicatorTypeGradient,
	}

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"destination_value":50}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify evaluation transitioned to en_curso
	eval, _ := mock.FindEvaluationByID(context.Background(), evalID)
	if eval.Status != domain.EvaluationStatusEnCurso {
		t.Errorf("expected status en_curso after auto-transition, got %q", eval.Status)
	}
	if eval.StartDate == nil {
		t.Error("expected StartDate to be set after auto-transition")
	}

	// Verify response includes transition metadata
	rec := ctx.Response().Writer.(*httptest.ResponseRecorder)
	var resp domain.SaveDestinationValueResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.StatusChanged == nil || !*resp.StatusChanged {
		t.Error("expected status_changed to be true")
	}
	if resp.NewStatus == nil || *resp.NewStatus != domain.EvaluationStatusEnCurso {
		t.Errorf("expected new_status en_curso, got %v", resp.NewStatus)
	}
}

func TestHandleSaveDestinationValue_NoTransition_WhenNotBorrador(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	// Set up evaluation already in en_curso
	e := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	e.ID = evalID
	mock.evaluations[evalID] = e

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_TRANS_02",
		Name: "No-Transition Test",
		Type: domain.IndicatorTypeGradient,
	}

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"destination_value":75}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify evaluation status was NOT changed
	eval, _ := mock.FindEvaluationByID(context.Background(), evalID)
	if eval.Status != domain.EvaluationStatusEnCurso {
		t.Errorf("expected status to remain en_curso, got %q", eval.Status)
	}

	// Verify response does NOT include transition metadata
	rec := ctx.Response().Writer.(*httptest.ResponseRecorder)
	var resp domain.SaveDestinationValueResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.StatusChanged != nil && *resp.StatusChanged {
		t.Error("expected status_changed to be absent or false when no transition")
	}
	if resp.NewStatus != nil {
		t.Errorf("expected new_status to be absent, got %v", *resp.NewStatus)
	}
}

func TestHandleSaveDestinationValue_ResponseJSON_IncludesStatusChangedOnTransition(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	// Set up borrador evaluation
	e := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e.ID = evalID
	e.StartDate = nil
	mock.evaluations[evalID] = e

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_TRANS_03",
		Name: "JSON Response Test",
		Type: domain.IndicatorTypeGradient,
	}

	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"destination_value":25}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	_ = mock.GrantAccess(context.Background(), evalID, testAdminUserID, domain.AccessLevelCarga)
	setCtxRole(ctx, "gestor_destino")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveDestinationValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	rec := ctx.Response().Writer.(*httptest.ResponseRecorder)
	body := rec.Body.String()

	// Raw JSON must contain status_changed:true and new_status:"en_curso"
	if !strings.Contains(body, `"status_changed":true`) {
		t.Errorf("expected response JSON to contain status_changed:true, got: %s", body)
	}
	if !strings.Contains(body, `"new_status":"en_curso"`) {
		t.Errorf("expected response JSON to contain new_status:\"en_curso\", got: %s", body)
	}

	// Now do a second save on same (now en_curso) evaluation — fresh context to avoid body accumulation
	e2 := echo.New()
	req2 := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{"destination_value":100}`))
	req2.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec2 := httptest.NewRecorder()
	ctx2 := e2.NewContext(req2, rec2)
	ctx2.Set("user_id", testAdminUserID.String())
	ctx2.Set("role", "gestor_destino")
	ctx2.SetParamNames("evaluationId", "id")
	ctx2.SetParamValues(evalID.String(), indicatorID.String())

	err = uc.HandleSaveDestinationValue(ctx2)
	if err != nil {
		t.Fatalf("unexpected error on second save: %v", err)
	}

	body2 := rec2.Body.String()

	if strings.Contains(body2, `"status_changed"`) {
		t.Errorf("expected second save response to NOT contain status_changed, got: %s", body2)
	}
}

func TestHandleSaveEvaluatorValue_NoAutoTransition(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()

	// Set up evaluation in borrador
	e := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e.ID = evalID
	e.StartDate = nil
	mock.evaluations[evalID] = e

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_TRANS_04",
		Name: "Evaluator No-Transition Test",
		Type: domain.IndicatorTypeGradient,
	}

	// admin role bypasses the en_evaluacion status check in HandleSaveEvaluatorValue
	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"evaluator_value":50}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	// setupTest already sets role="admin" and user_id=testAdminUserID
	setCtxRole(ctx, "admin")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveEvaluatorValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify evaluation status was NOT changed by evaluator save
	eval, _ := mock.FindEvaluationByID(context.Background(), evalID)
	if eval.Status != domain.EvaluationStatusBorrador {
		t.Errorf("expected status to remain borrador after evaluator save, got %q", eval.Status)
	}
	if eval.StartDate != nil {
		t.Error("expected StartDate to remain nil after evaluator save (no auto-transition)")
	}

	// Response should just be {"status":"saved"}, no transition metadata
	rec := ctx.Response().Writer.(*httptest.ResponseRecorder)
	body := rec.Body.String()
	if strings.Contains(body, "status_changed") {
		t.Errorf("evaluator save response should NOT contain status_changed, got: %s", body)
	}
}

// Regression test: when the destination creates the IndicatorValue first (without
// an evaluator_value), and the evaluator saves for the first time, the initial
// evaluation-source history entry must be created. Previously the check
// `existingIV.EvaluatorValue != nil && *existingIV.EvaluatorValue != *req.EvaluatorValue`
// dropped this case because it short-circuited on the nil check.
func TestHandleSaveEvaluatorValue_FirstSaveAfterDestino_CreatesHistory(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()
	ivID := uuid.New()

	// Set up evaluation in borrador
	e := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e.ID = evalID
	e.StartDate = nil
	mock.evaluations[evalID] = e

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_FIRST_EVAL",
		Name: "Test Indicator",
		Type: domain.IndicatorTypeGradient,
	}

	// IV was created by destination with a destination_value but NO evaluator_value yet
	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:               ivID,
		IndicatorID:      indicatorID,
		EvaluationID:     evalID,
		DestinationValue: intPtr(50),
		EvaluatorValue:   nil, // key: previous behavior would skip history here
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	// Evaluator saves for the first time
	ctx.SetParamNames("evaluationId", "id")
	ctx.SetParamValues(evalID.String(), indicatorID.String())
	reqBody := `{"evaluator_value": 75, "evaluator_observations": "Primer save del evaluador"}`
	req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	setCtxRole(ctx, "admin")
	setCtxUserID(ctx, testAdminUserID)

	err := uc.HandleSaveEvaluatorValue(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Find the new history entry
	var found *domain.IndicatorHistory
	for _, h := range mock.indicatorHistory {
		if h.IndicatorValueID == ivID && h.Source == "evaluation" {
			found = h
			break
		}
	}
	if found == nil {
		t.Fatal("expected an evaluation-source history entry on first evaluator save, got none")
	}
	if found.EvaluatorValue == nil || *found.EvaluatorValue != 75 {
		t.Errorf("expected EvaluatorValue=75, got %v", found.EvaluatorValue)
	}
	if found.Observations == nil || *found.Observations != "Primer save del evaluador" {
		t.Errorf("expected observations to be saved, got %v", found.Observations)
	}
}

// Companion test: when the evaluator saves the same value twice, no duplicate
// history row should be created. The fix must not turn every re-save into a new
// history entry.
func TestHandleSaveEvaluatorValue_SameValueTwice_NoDuplicateHistory(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	evalID := uuid.New()
	indicatorID := uuid.New()
	ivID := uuid.New()

	e := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e.ID = evalID
	mock.evaluations[evalID] = e

	mock.indicatorMap[indicatorID] = &domain.Indicator{
		ID:   indicatorID,
		Code: "TEST_DUP_HIST",
		Name: "Test Indicator",
		Type: domain.IndicatorTypeGradient,
	}

	now := time.Now()
	mock.ivMap[ivID] = &domain.IndicatorValue{
		ID:             ivID,
		IndicatorID:    indicatorID,
		EvaluationID:   evalID,
		EvaluatorValue: intPtr(50), // already has a value
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	save := func() {
		ctx.SetParamNames("evaluationId", "id")
		ctx.SetParamValues(evalID.String(), indicatorID.String())
		reqBody := `{"evaluator_value": 50, "evaluator_observations": "same value"}`
		req := httptest.NewRequest(http.MethodPut, "/", strings.NewReader(reqBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		ctx.SetRequest(req)
		setCtxRole(ctx, "admin")
		setCtxUserID(ctx, testAdminUserID)
		if err := uc.HandleSaveEvaluatorValue(ctx); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	}

	save()
	save()
	save()

	count := 0
	for _, h := range mock.indicatorHistory {
		if h.IndicatorValueID == ivID && h.Source == "evaluation" {
			count++
		}
	}
	if count != 0 {
		t.Errorf("expected 0 history entries for 3 saves of same value, got %d", count)
	}
}
