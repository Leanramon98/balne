package usecases

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"
	"time"

	"evaluations-service/internal/domain"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ── Mock Repository ──────────────────────────────────────────────────

type mockRepo struct {
	evaluations        map[uuid.UUID]*domain.Evaluation
	accessEntries      map[string]domain.AccessLevel // key: "evalID:userID"
	users              map[string]struct{}            // set of known user IDs
	destinations       map[uuid.UUID]*domain.Destination
	indicatorValues    []indicatorValueRow
	ivMap              map[uuid.UUID]*domain.IndicatorValue  // key: indicatorValueID
	indicatorMap       map[uuid.UUID]*domain.Indicator       // key: indicatorID
	indicatorHistory   map[uuid.UUID]*domain.IndicatorHistory
	indicatorMessages  map[uuid.UUID]*domain.IndicatorMessage
	actionLinks        []actionLinkRow
	scopeProgress      []*domain.ScopeProgress
	actions            map[uuid.UUID]*domain.Action
	evidence           map[uuid.UUID]*domain.ActionEvidence
	links              map[uuid.UUID]*domain.ActionIndicatorLink
	goodPractices      map[uuid.UUID]*domain.GoodPractice
	translations       map[uuid.UUID]*domain.ActionTranslation
	translationsCatalog map[uuid.UUID]*domain.CatalogTranslation
	dtiPlans           map[uuid.UUID]*domain.DtiPlan
	dtiPlanGoals       map[uuid.UUID]*domain.DtiPlanGoal
	beginTxCalled      bool
	txCommits          int
	txRollbacks        int
	results            []*domain.ResultsData
}

type indicatorValueRow struct {
	ID              uuid.UUID
	IndicatorID     uuid.UUID
	EvaluationID    uuid.UUID
	DestinationValue *int
	EvaluatorValue   *int
}

type actionLinkRow struct {
	ActionID    uuid.UUID
	IndicatorID uuid.UUID
	EvalID      uuid.UUID
	Status      string
}

func newMockRepo() *mockRepo {
	return &mockRepo{
		evaluations:      make(map[uuid.UUID]*domain.Evaluation),
		accessEntries:    make(map[string]domain.AccessLevel),
		users:            make(map[string]struct{}),
		destinations:     make(map[uuid.UUID]*domain.Destination),
		ivMap:            make(map[uuid.UUID]*domain.IndicatorValue),
		indicatorMap:     make(map[uuid.UUID]*domain.Indicator),
		indicatorHistory: make(map[uuid.UUID]*domain.IndicatorHistory),
		indicatorMessages: make(map[uuid.UUID]*domain.IndicatorMessage),
		actions:          make(map[uuid.UUID]*domain.Action),
		evidence:         make(map[uuid.UUID]*domain.ActionEvidence),
		links:            make(map[uuid.UUID]*domain.ActionIndicatorLink),
		goodPractices:    make(map[uuid.UUID]*domain.GoodPractice),
		translations:         make(map[uuid.UUID]*domain.ActionTranslation),
		translationsCatalog:  make(map[uuid.UUID]*domain.CatalogTranslation),
		dtiPlans:             make(map[uuid.UUID]*domain.DtiPlan),
		dtiPlanGoals:     make(map[uuid.UUID]*domain.DtiPlanGoal),
	}
}

func (m *mockRepo) CreateEvaluation(_ context.Context, e *domain.Evaluation) error {
	m.evaluations[e.ID] = e
	return nil
}

func (m *mockRepo) FindEvaluationByID(_ context.Context, id uuid.UUID) (*domain.Evaluation, error) {
	e, ok := m.evaluations[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return e, nil
}

func (m *mockRepo) FindEvaluations(_ context.Context, destinationID, evalType, status string, limit, offset int) ([]*domain.Evaluation, error) {
	var filtered []*domain.Evaluation
	for _, e := range m.evaluations {
		if destinationID != "" && e.DestinationID.String() != destinationID {
			continue
		}
		if evalType != "" && string(e.Type) != evalType {
			continue
		}
		if status != "" && string(e.Status) != status {
			continue
		}
		filtered = append(filtered, e)
	}

	// Sort by CreatedAt DESC to simulate DB ordering
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})

	// Apply pagination
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if offset >= len(filtered) {
		return nil, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], nil
}

func (m *mockRepo) CountEvaluations(_ context.Context, destinationID, evalType, status string) (int, error) {
	count := 0
	for _, e := range m.evaluations {
		if destinationID != "" && e.DestinationID.String() != destinationID {
			continue
		}
		if evalType != "" && string(e.Type) != evalType {
			continue
		}
		if status != "" && string(e.Status) != status {
			continue
		}
		count++
	}
	return count, nil
}

func (m *mockRepo) UpdateEvaluation(_ context.Context, e *domain.Evaluation) error {
	m.evaluations[e.ID] = e
	return nil
}

func (m *mockRepo) DeleteEvaluation(_ context.Context, id uuid.UUID) error {
	delete(m.evaluations, id)
	return nil
}

func (m *mockRepo) GrantAccess(_ context.Context, evalID, userID uuid.UUID, level domain.AccessLevel) error {
	key := evalID.String() + ":" + userID.String()
	m.accessEntries[key] = level
	return nil
}

func (m *mockRepo) RevokeAccess(_ context.Context, evalID, userID uuid.UUID) error {
	key := evalID.String() + ":" + userID.String()
	delete(m.accessEntries, key)
	return nil
}

func (m *mockRepo) ListAccess(_ context.Context, evalID uuid.UUID) ([]*domain.EvaluationUser, error) {
	var items []*domain.EvaluationUser
	for key, level := range m.accessEntries {
		parts := strings.SplitN(key, ":", 2)
		if len(parts) == 2 && parts[0] == evalID.String() {
			uID, _ := uuid.Parse(parts[1])
			items = append(items, &domain.EvaluationUser{
				EvaluationID: evalID,
				UserID:       uID,
				AccessLevel:  level,
			})
		}
	}
	return items, nil
}

func (m *mockRepo) GetUserAccessLevel(_ context.Context, evalID, userID uuid.UUID) (domain.AccessLevel, error) {
	key := evalID.String() + ":" + userID.String()
	level, ok := m.accessEntries[key]
	if !ok {
		return "", sql.ErrNoRows
	}
	return level, nil
}

func (m *mockRepo) GetScopeProgress(_ context.Context, _ uuid.UUID) ([]*domain.ScopeProgress, error) {
	return m.scopeProgress, nil
}

func (m *mockRepo) BeginTx(_ context.Context) (*sql.Tx, error) {
	m.beginTxCalled = true
	return nil, nil // nil is OK for mock since we don't use tx object directly
}

func (m *mockRepo) CreateEvaluationTx(_ *sql.Tx, e *domain.Evaluation) error {
	m.evaluations[e.ID] = e
	return nil
}

func (m *mockRepo) CopyIndicatorValuesTx(_ *sql.Tx, sourceEvalID, newEvalID uuid.UUID) (map[uuid.UUID]uuid.UUID, error) {
	mapping := make(map[uuid.UUID]uuid.UUID)
	for _, iv := range m.indicatorValues {
		if iv.EvaluationID == sourceEvalID {
			newIVID := uuid.New()
			mapping[iv.IndicatorID] = newIVID
		}
	}
	return mapping, nil
}

func (m *mockRepo) CreateIndicatorHistoryTx(_ *sql.Tx, _ uuid.UUID, _ uuid.UUID, _ uuid.UUID) error {
	return nil
}

func (m *mockRepo) CopyActionIndicatorLinksTx(_ *sql.Tx, sourceEvalID, newEvalID uuid.UUID) error {
	return nil
}

func (m *mockRepo) GetSourceIndicatorValueIDs(_ context.Context, evaluationID uuid.UUID) ([]domain.SourceIndicatorRow, error) {
	var items []domain.SourceIndicatorRow
	for _, iv := range m.indicatorValues {
		if iv.EvaluationID == evaluationID {
			items = append(items, domain.SourceIndicatorRow{
				ID:          iv.ID,
				IndicatorID: iv.IndicatorID,
			})
		}
	}
	return items, nil
}

// ── Catalog stubs (required by interface) ───────────────────────────

func (m *mockRepo) FindAllSubnationalLevels(_ context.Context) ([]*domain.SubnationalLevel, error) { return nil, nil }
func (m *mockRepo) FindSubnationalLevelByID(_ context.Context, _ uuid.UUID) (*domain.SubnationalLevel, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateSubnationalLevel(_ context.Context, _ *domain.SubnationalLevel) error { return nil }
func (m *mockRepo) UpdateSubnationalLevel(_ context.Context, _ *domain.SubnationalLevel) error { return nil }
func (m *mockRepo) DeleteSubnationalLevel(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllDestinationTypologies(_ context.Context) ([]*domain.DestinationTypology, error) { return nil, nil }
func (m *mockRepo) FindDestinationTypologyByID(_ context.Context, _ uuid.UUID) (*domain.DestinationTypology, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateDestinationTypology(_ context.Context, _ *domain.DestinationTypology) error { return nil }
func (m *mockRepo) UpdateDestinationTypology(_ context.Context, _ *domain.DestinationTypology) error { return nil }
func (m *mockRepo) DeleteDestinationTypology(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllPopulationRanges(_ context.Context) ([]*domain.PopulationRange, error) { return nil, nil }
func (m *mockRepo) FindPopulationRangeByID(_ context.Context, _ uuid.UUID) (*domain.PopulationRange, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreatePopulationRange(_ context.Context, _ *domain.PopulationRange) error { return nil }
func (m *mockRepo) UpdatePopulationRange(_ context.Context, _ *domain.PopulationRange) error { return nil }
func (m *mockRepo) DeletePopulationRange(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllRegions(_ context.Context) ([]*domain.Region, error) { return nil, nil }
func (m *mockRepo) FindRegionByID(_ context.Context, _ uuid.UUID) (*domain.Region, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateRegion(_ context.Context, _ *domain.Region) error { return nil }
func (m *mockRepo) UpdateRegion(_ context.Context, _ *domain.Region) error { return nil }
func (m *mockRepo) DeleteRegion(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllMemberTypes(_ context.Context) ([]*domain.MemberType, error) { return nil, nil }
func (m *mockRepo) FindMemberTypeByID(_ context.Context, _ uuid.UUID) (*domain.MemberType, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateMemberType(_ context.Context, _ *domain.MemberType) error { return nil }
func (m *mockRepo) UpdateMemberType(_ context.Context, _ *domain.MemberType) error { return nil }
func (m *mockRepo) DeleteMemberType(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllResponsibleAreas(_ context.Context) ([]*domain.ResponsibleArea, error) { return nil, nil }
func (m *mockRepo) FindResponsibleAreaByID(_ context.Context, _ uuid.UUID) (*domain.ResponsibleArea, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateResponsibleArea(_ context.Context, _ *domain.ResponsibleArea) error { return nil }
func (m *mockRepo) UpdateResponsibleArea(_ context.Context, _ *domain.ResponsibleArea) error { return nil }
func (m *mockRepo) DeleteResponsibleArea(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllAxisLevels(_ context.Context) ([]*domain.AxisLevel, error) { return nil, nil }
func (m *mockRepo) FindAxisLevelByID(_ context.Context, _ uuid.UUID) (*domain.AxisLevel, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateAxisLevel(_ context.Context, _ *domain.AxisLevel) error { return nil }
func (m *mockRepo) UpdateAxisLevel(_ context.Context, _ *domain.AxisLevel) error { return nil }
func (m *mockRepo) DeleteAxisLevel(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllScopes(_ context.Context) ([]*domain.Scope, error) { return nil, nil }
func (m *mockRepo) FindScopeByID(_ context.Context, _ uuid.UUID) (*domain.Scope, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateScope(_ context.Context, _ *domain.Scope) error { return nil }
func (m *mockRepo) UpdateScope(_ context.Context, _ *domain.Scope) error { return nil }
func (m *mockRepo) DeleteScope(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindAllRequirements(_ context.Context) ([]*domain.Requirement, error) { return nil, nil }
func (m *mockRepo) FindRequirementByID(_ context.Context, _ uuid.UUID) (*domain.Requirement, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateRequirement(_ context.Context, _ *domain.Requirement) error { return nil }
func (m *mockRepo) UpdateRequirement(_ context.Context, _ *domain.Requirement) error { return nil }
func (m *mockRepo) DeleteRequirement(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockRepo) FindRequirementsByScope(_ context.Context, _ uuid.UUID) ([]*domain.Requirement, error) { return nil, nil }
func (m *mockRepo) FindAllIndicators(_ context.Context) ([]*domain.Indicator, error) { return nil, nil }
func (m *mockRepo) FindIndicatorsByRequirement(_ context.Context, _ uuid.UUID) ([]*domain.Indicator, error) { return nil, nil }
func (m *mockRepo) FindIndicatorsByScope(_ context.Context, _ uuid.UUID) ([]*domain.Indicator, error) { return nil, nil }
func (m *mockRepo) FindIndicatorsByScopeAndEvaluation(_ context.Context, _, _ uuid.UUID) ([]*domain.IndicatorWithValue, error) { return nil, nil }
func (m *mockRepo) CreateIndicator(_ context.Context, _ *domain.Indicator) error { return nil }
func (m *mockRepo) UpdateIndicator(_ context.Context, _ *domain.Indicator) error { return nil }
func (m *mockRepo) DeleteIndicator(_ context.Context, _ uuid.UUID) error { return nil }

// ── Destination CRUD stubs ──────────────────────────────────────────

func (m *mockRepo) CreateDestination(_ context.Context, _ *domain.Destination) error { return nil }
func (m *mockRepo) FindDestinationByID(_ context.Context, id uuid.UUID) (*domain.Destination, error) {
	d, ok := m.destinations[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return d, nil
}
func (m *mockRepo) FindDestinations(_ context.Context) ([]*domain.Destination, error) { return nil, nil }
func (m *mockRepo) UpdateDestination(_ context.Context, _ *domain.Destination) error { return nil }
func (m *mockRepo) DeleteDestination(_ context.Context, _ uuid.UUID) error { return nil }

func (m *mockRepo) FindDestinationsByRegionID(_ context.Context, regionID string) ([]*domain.Destination, error) {
	var items []*domain.Destination
	for _, d := range m.destinations {
		if d.RegionID != nil && d.RegionID.String() == regionID {
			items = append(items, d)
		}
	}
	return items, nil
}

func (m *mockRepo) FindEvaluationsByDestinationIDs(_ context.Context, destIDs []uuid.UUID, evalType, status string, limit, offset int) ([]*domain.Evaluation, int, error) {
	if len(destIDs) == 0 {
		return nil, 0, nil
	}
	destSet := make(map[uuid.UUID]struct{}, len(destIDs))
	for _, id := range destIDs {
		destSet[id] = struct{}{}
	}
	var filtered []*domain.Evaluation
	for _, e := range m.evaluations {
		if _, ok := destSet[e.DestinationID]; !ok {
			continue
		}
		if evalType != "" && string(e.Type) != evalType {
			continue
		}
		if status != "" && string(e.Status) != status {
			continue
		}
		filtered = append(filtered, e)
	}
	// Sort by CreatedAt DESC
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})
	total := len(filtered)
	// Apply pagination
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if offset >= len(filtered) {
		return nil, total, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], total, nil
}

func (m *mockRepo) FindEvaluationsByUserID(_ context.Context, userID string, evalTypes []string, status string, limit, offset int) ([]*domain.Evaluation, int, error) {
	// Build set of allowed eval types
	typeSet := make(map[string]struct{}, len(evalTypes))
	for _, et := range evalTypes {
		typeSet[et] = struct{}{}
	}
	var filtered []*domain.Evaluation
	for _, e := range m.evaluations {
		// Check user access via accessEntries (key: "evalID:userID")
		key := e.ID.String() + ":" + userID
		if _, ok := m.accessEntries[key]; !ok {
			continue
		}
		if len(typeSet) > 0 {
			if _, ok := typeSet[string(e.Type)]; !ok {
				continue
			}
		}
		if status != "" && string(e.Status) != status {
			continue
		}
		filtered = append(filtered, e)
	}
	// Sort by CreatedAt DESC
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})
	total := len(filtered)
	// Apply pagination
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if offset >= len(filtered) {
		return nil, total, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], total, nil
}

// ── Indicator Value mocks ──────────────────────────────────────────

func (m *mockRepo) FindIndicatorByID(_ context.Context, id uuid.UUID) (*domain.Indicator, error) {
	ind, ok := m.indicatorMap[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return ind, nil
}

func (m *mockRepo) FindIndicatorValueByID(_ context.Context, id uuid.UUID) (*domain.IndicatorValue, error) {
	iv, ok := m.ivMap[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return iv, nil
}

func (m *mockRepo) FindIndicatorValueByEvalAndIndicator(_ context.Context, evaluationID, indicatorID uuid.UUID) (*domain.IndicatorValue, error) {
	for _, iv := range m.ivMap {
		if iv.EvaluationID == evaluationID && iv.IndicatorID == indicatorID {
			return iv, nil
		}
	}
	return nil, sql.ErrNoRows
}

func (m *mockRepo) CreateIndicatorValue(_ context.Context, iv *domain.IndicatorValue) error {
	m.ivMap[iv.ID] = iv
	return nil
}

func (m *mockRepo) UpdateIndicatorValue(_ context.Context, iv *domain.IndicatorValue) error {
	m.ivMap[iv.ID] = iv
	return nil
}

func (m *mockRepo) DeleteIndicatorValueContent(_ context.Context, id uuid.UUID) error {
	iv, ok := m.ivMap[id]
	if !ok {
		return sql.ErrNoRows
	}
	iv.DestinationValue = nil
	iv.Meta = nil
	iv.MetaDate = nil
	iv.DestinationObservations = nil
	return nil
}

// ── IndicatorHistory mocks ─────────────────────────────────────────

func (m *mockRepo) CreateIndicatorHistory(_ context.Context, h *domain.IndicatorHistory) error {
	m.indicatorHistory[h.ID] = h
	return nil
}

func (m *mockRepo) ListIndicatorHistory(_ context.Context, indicatorValueID uuid.UUID) ([]*domain.IndicatorHistory, error) {
	var items []*domain.IndicatorHistory
	for _, h := range m.indicatorHistory {
		if h.IndicatorValueID == indicatorValueID {
			items = append(items, h)
		}
	}
	return items, nil
}

// ── IndicatorMessage mocks ─────────────────────────────────────────

func (m *mockRepo) CreateIndicatorMessage(_ context.Context, msg *domain.IndicatorMessage) error {
	m.indicatorMessages[msg.ID] = msg
	return nil
}

func (m *mockRepo) ListIndicatorMessages(_ context.Context, indicatorValueID uuid.UUID) ([]*domain.IndicatorMessage, error) {
	var items []*domain.IndicatorMessage
	for _, msg := range m.indicatorMessages {
		if msg.IndicatorValueID == indicatorValueID {
			items = append(items, msg)
		}
	}
	return items, nil
}

// ── Mock UsersClient ──────────────────────────────────────────────────

type mockUsersClient struct {
	adminUsers []AdminUser
}

func (m *mockUsersClient) GetAdminUsers(_ context.Context) ([]AdminUser, error) {
	return m.adminUsers, nil
}

// ── Test Helpers ─────────────────────────────────────────────────────

func setupTest(t *testing.T) (*Logic, *mockRepo, echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	mock := newMockRepo()
	uc := NewLogicWithRepo(mock)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	// Set up JWT claims in context (simulating auth middleware)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.Set("destination_id", nil)
	ctx.Set("permissions", struct {
		AccessScope             string
		CanWriteValues          bool
		CanManageUsers          bool
		CanApproveGoodPractices bool
		EvaluationTypes         []string
	}{
		AccessScope: "global",
	})

	return uc, mock, ctx, rec
}

var testAdminUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001")
var testDestUserID = uuid.MustParse("00000000-0000-0000-0000-000000000002")
var testDestID = uuid.MustParse("11111111-1111-1111-1111-111111111111")
var testEvalID = uuid.MustParse("22222222-2222-2222-2222-222222222222")

func createTestEvaluation(status domain.EvaluationStatus, evalType domain.EvaluationType) *domain.Evaluation {
	now := time.Now()
	return &domain.Evaluation{
		ID:            testEvalID,
		DestinationID: testDestID,
		Name:          "Test Evaluation",
		Type:          evalType,
		Status:        status,
		CreatedBy:     testAdminUserID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

func setCtxRole(ctx echo.Context, role string) {
	ctx.Set("role", role)
}

func setCtxUserID(ctx echo.Context, userID uuid.UUID) {
	ctx.Set("user_id", userID.String())
}

func setCtxPermsCanApprove(ctx echo.Context, canApprove bool) {
	ctx.Set("permissions", struct {
		AccessScope             string
		CanWriteValues          bool
		CanManageUsers          bool
		CanApproveGoodPractices bool
		EvaluationTypes         []string
	}{
		AccessScope:             "destination",
		CanApproveGoodPractices: canApprove,
	})
}

// ═════════════════════════════════════════════════════════════════════
// 1b.7 — State Machine Tests (integration with use case)
// ═════════════════════════════════════════════════════════════════════

func TestHandleChangeStatus_InvalidTransition_Returns422(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: an evaluation in borrador
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	// When: trying to transition to en_evaluacion (skip states)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"status":"en_evaluacion"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	err := uc.HandleChangeStatus(ctx)
	if err != nil {
		// Echo returns errors as HTTP errors — check it's 422
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T: %v", err, err)
		}
		if httpErr.Code != http.StatusUnprocessableEntity {
			t.Errorf("expected status 422, got %d", httpErr.Code)
		}
		// Verify allowed transitions are included
		resp, ok := httpErr.Message.(domain.ChangeStatusResponse)
		if !ok {
			t.Errorf("expected ChangeStatusResponse in message, got %T", httpErr.Message)
		} else if len(resp.AllowedTransitions) == 0 {
			t.Error("expected non-empty AllowedTransitions")
		} else {
			found := false
			for _, a := range resp.AllowedTransitions {
				if a == domain.EvaluationStatusEnCurso {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("expected en_curso in allowed transitions, got %v", resp.AllowedTransitions)
			}
		}
	} else {
		// Handler might write directly to response
		if rec.Code != http.StatusUnprocessableEntity {
			t.Errorf("expected status 422, got %d", rec.Code)
		}
		var resp domain.ChangeStatusResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if len(resp.AllowedTransitions) == 0 {
			t.Error("expected non-empty AllowedTransitions")
		}
	}
}

func TestHandleChangeStatus_ValidTransition_Returns200(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: an evaluation in borrador
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	// When: transitioning to en_curso (valid)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"status":"en_curso"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleChangeStatus(ctx)
	if err != nil {
		httpErr, ok := err.(*echo.HTTPError)
		if ok && httpErr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", httpErr.Code, httpErr.Message)
		}
	}

	// Verify status was updated
	eval, _ := mock.FindEvaluationByID(ctx.Request().Context(), testEvalID)
	if eval.Status != domain.EvaluationStatusEnCurso {
		t.Errorf("expected status en_curso, got %q", eval.Status)
	}
}

func TestHandleChangeStatus_AnuladaToBorrador_Reactivation(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: an evaluation in anulada
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusAnulada, domain.EvaluationTypeAutodiagnostico)

	// When: reactivating to borrador
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"status":"borrador"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleChangeStatus(ctx)
	if err != nil {
		httpErr, ok := err.(*echo.HTTPError)
		if ok && httpErr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %v", httpErr.Code, httpErr.Message)
		}
	}

	eval, _ := mock.FindEvaluationByID(ctx.Request().Context(), testEvalID)
	if eval.Status != domain.EvaluationStatusBorrador {
		t.Errorf("expected status borrador, got %q", eval.Status)
	}
}

func TestHandleChangeStatus_Cerrada_NoTransitions(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: a closed evaluation
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAutodiagnostico)

	// When: trying any transition
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"status":"borrador"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	err := uc.HandleChangeStatus(ctx)
	if err != nil {
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T", err)
		}
		if httpErr.Code != http.StatusUnprocessableEntity {
			t.Errorf("expected 422, got %d", httpErr.Code)
		}
	} else {
		if rec.Code != http.StatusUnprocessableEntity {
			t.Errorf("expected 422, got %d", rec.Code)
		}
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1b.9 — Access Level Enforcement Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleChangeStatus_CargaUser_Returns403(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: a carga-level access user
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	mock.GrantAccess(context.Background(), testEvalID, testDestUserID, domain.AccessLevelCarga)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"status":"en_curso"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "gestor_destino")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	err := uc.HandleChangeStatus(ctx)
	if err != nil {
		httpErr, ok := err.(*echo.HTTPError)
		if !ok {
			t.Fatalf("expected HTTPError, got %T", err)
		}
		if httpErr.Code != http.StatusForbidden {
			t.Errorf("expected 403, got %d", httpErr.Code)
		}
	} else if rec.Code != 0 && rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
}

func TestHandleChangeStatus_Admin_AlwaysAllowed(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: admin user (already set in setupTest)
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	// When: admin changes status
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"status":"en_curso"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleChangeStatus(ctx)
	if err != nil {
		httpErr, ok := err.(*echo.HTTPError)
		if ok && httpErr.Code != http.StatusOK {
			t.Fatalf("expected 200 for admin, got %d", httpErr.Code)
		}
	}

	eval, _ := mock.FindEvaluationByID(ctx.Request().Context(), testEvalID)
	if eval.Status != domain.EvaluationStatusEnCurso {
		t.Errorf("expected en_curso, got %q", eval.Status)
	}
}

func TestHandleGrantAccess_AdminDestino_OwnDest_Success(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: admin_destino with administracion access on an evaluation for their destination
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	mock.GrantAccess(ctx.Request().Context(), testEvalID, testDestUserID, domain.AccessLevelAdministracion)
	setCtxRole(ctx, "admin_destino")
	setCtxUserID(ctx, testDestUserID)

	// When: granting access to another user
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	otherUserID := uuid.New()
	reqBody := `{"user_id":"` + otherUserID.String() + `","access_level":"carga"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleGrantEvaluationAccess(ctx)
	if err != nil {
		t.Fatalf("expected no error for authorized user, got: %v", err)
	}

	// Verify access was granted
	level, _ := mock.GetUserAccessLevel(ctx.Request().Context(), testEvalID, otherUserID)
	if level != domain.AccessLevelCarga {
		t.Errorf("expected carga access, got %q", level)
	}
}

func TestHandleGrantAccess_AdminDestino_OtherDest_Forbidden(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: admin_destino but WITHOUT administracion access on this eval
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	// No access entry for this user/admin_destino
	setCtxRole(ctx, "admin_destino")
	setCtxUserID(ctx, testDestUserID)
	// Set destination_id so they "belong" but have no access level on this eval
	destStr := testDestID.String()
	ctx.Set("destination_id", &destStr)

	// When: trying to grant access
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	otherUserID := uuid.New()
	reqBody := `{"user_id":"` + otherUserID.String() + `","access_level":"carga"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleGrantEvaluationAccess(ctx)
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

func TestHandleGrantAccess_GlobalAdmin_AnyEval_Success(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: admin (global) - already set in setupTest

	// When: granting access on any evaluation (no explicit access needed)
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	otherUserID := uuid.New()
	reqBody := `{"user_id":"` + otherUserID.String() + `","access_level":"evaluador"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandleGrantEvaluationAccess(ctx)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	level, _ := mock.GetUserAccessLevel(ctx.Request().Context(), testEvalID, otherUserID)
	if level != domain.AccessLevelEvaluador {
		t.Errorf("expected evaluador access, got %q", level)
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1b.8 — Promotion Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandlePromoteEvaluation_NonCerrada_Returns422(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: an evaluation in borrador (not cerrada)
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	// When: trying to promote
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandlePromoteEvaluation(ctx)
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

func TestHandlePromoteEvaluation_Auditoria_NoNextType(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: an auditoria evaluation in cerrada
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)

	// When: trying to promote
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandlePromoteEvaluation(ctx)
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

func TestHandlePromoteEvaluation_AutodiagnosticoToDiagnostico_Success(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: an autodiagnostico evaluation in cerrada with indicator values
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAutodiagnostico)
	mock.indicatorValues = append(mock.indicatorValues, indicatorValueRow{
		ID:              uuid.New(),
		IndicatorID:     uuid.New(),
		EvaluationID:    testEvalID,
		DestinationValue: intPtr(75),
		EvaluatorValue:   intPtr(50),
	})

	// When: promoting
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandlePromoteEvaluation(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	// Verify new evaluation was created
	var promotedEval *domain.Evaluation
	for _, e := range mock.evaluations {
		if e.PromotedFromID != nil && *e.PromotedFromID == testEvalID {
			promotedEval = e
			break
		}
	}
	if promotedEval == nil {
		t.Fatal("expected promoted evaluation to exist")
	}
	if promotedEval.Type != domain.EvaluationTypeDiagnostico {
		t.Errorf("expected type diagnostico, got %q", promotedEval.Type)
	}
	if promotedEval.Status != domain.EvaluationStatusBorrador {
		t.Errorf("expected borrador status, got %q", promotedEval.Status)
	}
	if promotedEval.PromotedFromID == nil || *promotedEval.PromotedFromID != testEvalID {
		t.Error("expected promoted_from_id to point to source evaluation")
	}
}

func TestHandlePromoteEvaluation_DiagnosticoToAuditoria_Success(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: a diagnostico evaluation in cerrada
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeDiagnostico)
	mock.indicatorValues = append(mock.indicatorValues, indicatorValueRow{
		ID:            uuid.New(),
		IndicatorID:   uuid.New(),
		EvaluationID:  testEvalID,
		DestinationValue: intPtr(100),
	})

	// When: promoting
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandlePromoteEvaluation(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	var promotedEval *domain.Evaluation
	for _, e := range mock.evaluations {
		if e.PromotedFromID != nil && *e.PromotedFromID == testEvalID {
			promotedEval = e
			break
		}
	}
	if promotedEval == nil {
		t.Fatal("expected promoted evaluation to exist")
	}
	if promotedEval.Type != domain.EvaluationTypeAuditoria {
		t.Errorf("expected type auditoria, got %q", promotedEval.Type)
	}
}

func TestHandlePromoteEvaluation_MedicionEspontanea_NotPromotable(t *testing.T) {
	uc, mock, ctx, _ := setupTest(t)

	// Given: a medicion_espontanea in cerrada
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeMedicionEspontanea)

	// When: promoting
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	ctx.SetRequest(req)

	err := uc.HandlePromoteEvaluation(ctx)
	if err == nil {
		t.Fatal("expected error for medicion_espontanea promotion")
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
// B06 — Allowed Transitions in GET Evaluation
// ═════════════════════════════════════════════════════════════════════

func TestHandleGetEvaluation_AllowedTransitions(t *testing.T) {
	tests := []struct {
		name     string
		status   domain.EvaluationStatus
		expected []domain.EvaluationStatus
	}{
		{
			name:     "borrador returns en_curso and anulada",
			status:   domain.EvaluationStatusBorrador,
			expected: []domain.EvaluationStatus{domain.EvaluationStatusEnCurso, domain.EvaluationStatusAnulada},
		},
		{
			name:     "en_curso returns carga_finalizada and anulada",
			status:   domain.EvaluationStatusEnCurso,
			expected: []domain.EvaluationStatus{domain.EvaluationStatusCargaFinalizada, domain.EvaluationStatusAnulada},
		},
		{
			name:     "carga_finalizada returns en_evaluacion and anulada",
			status:   domain.EvaluationStatusCargaFinalizada,
			expected: []domain.EvaluationStatus{domain.EvaluationStatusEnEvaluacion, domain.EvaluationStatusAnulada},
		},
		{
			name:     "en_evaluacion returns cerrada and anulada",
			status:   domain.EvaluationStatusEnEvaluacion,
			expected: []domain.EvaluationStatus{domain.EvaluationStatusCerrada, domain.EvaluationStatusAnulada},
		},
		{
			name:     "cerrada returns empty transitions",
			status:   domain.EvaluationStatusCerrada,
			expected: nil, // terminal state — no transitions
		},
		{
			name:     "anulada returns borrador (reactivar)",
			status:   domain.EvaluationStatusAnulada,
			expected: []domain.EvaluationStatus{domain.EvaluationStatusBorrador},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc, mock, _, _ := setupTest(t)
			mock.evaluations[testEvalID] = createTestEvaluation(tt.status, domain.EvaluationTypeAutodiagnostico)

			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			ctx := e.NewContext(req, rec)
			ctx.Set("user_id", testAdminUserID.String())
			ctx.Set("role", "admin")
			ctx.SetParamNames("id")
			ctx.SetParamValues(testEvalID.String())

			err := uc.HandleGetEvaluation(ctx)
			if err != nil {
				t.Fatalf("HandleGetEvaluation: %v", err)
			}

			var resp map[string]interface{}
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatalf("unmarshal response: %v", err)
			}

			// AllowedTransitions should be present
			raw, hasTransitions := resp["allowed_transitions"]
			if !hasTransitions && tt.expected != nil {
				t.Fatal("response missing allowed_transitions field")
			}

			// If expected is nil, we accept either absent field or empty slice
			if tt.expected == nil {
				if hasTransitions {
					transSlice, ok := raw.([]interface{})
					if ok && len(transSlice) != 0 {
						t.Errorf("expected empty transitions for terminal state, got %v", transSlice)
					}
				}
				return
			}

			transSlice, ok := raw.([]interface{})
			if !ok {
				t.Fatalf("allowed_transitions is not a slice: %T", raw)
			}
			if len(transSlice) != len(tt.expected) {
				t.Fatalf("expected %d transitions, got %d: %v", len(tt.expected), len(transSlice), transSlice)
			}
			for i, exp := range tt.expected {
				if transSlice[i] != string(exp) {
					t.Errorf("transition[%d] = %v, want %v", i, transSlice[i], string(exp))
				}
			}
		})
	}
}

// ═════════════════════════════════════════════════════════════════════
// 1b.5 — Scope Progress Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleScopeProgress_ReturnsProgress(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)
	mock.scopeProgress = []*domain.ScopeProgress{
		{
			ScopeID:             uuid.New().String(),
			ScopeName:           "GOB 1",
			ScopeAcronym:        "GOB1",
			TotalIndicators:     10,
			CompletedIndicators: 5,
			CompletionPercent:   50.0,
			Status:              "orange",
		},
		{
			ScopeID:             uuid.New().String(),
			ScopeName:           "INN 1",
			ScopeAcronym:        "INN1",
			TotalIndicators:     8,
			CompletedIndicators: 8,
			CompletionPercent:   100.0,
			Status:              "green",
		},
	}

	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	err := uc.HandleScopeProgress(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	var progress []*domain.ScopeProgress
	if err := json.Unmarshal(rec.Body.Bytes(), &progress); err != nil {
		t.Fatalf("unmarshal progress: %v", err)
	}
	if len(progress) != 2 {
		t.Fatalf("expected 2 scopes, got %d", len(progress))
	}
	// First scope: 50% orange
	if progress[0].CompletionPercent != 50.0 {
		t.Errorf("expected 50%%, got %f", progress[0].CompletionPercent)
	}
	if progress[0].Status != "orange" {
		t.Errorf("expected orange status, got %q", progress[0].Status)
	}
	// Second scope: 100% green
	if progress[1].CompletionPercent != 100.0 {
		t.Errorf("expected 100%%, got %f", progress[1].CompletionPercent)
	}
	if progress[1].Status != "green" {
		t.Errorf("expected green status, got %q", progress[1].Status)
	}
}

// ── Report stubs ─────────────────────────────────────────────────

func (m *mockRepo) FindAllReports(_ context.Context) ([]*domain.Report, error) { return nil, nil }
func (m *mockRepo) FindReportByID(_ context.Context, _ uuid.UUID) (*domain.Report, error) { return nil, sql.ErrNoRows }
func (m *mockRepo) CreateReport(_ context.Context, _ *domain.Report) error { return nil }

// ── DtiPlan stubs ──────────────────────────────────────────────

func (m *mockRepo) CreateDtiPlan(_ context.Context, p *domain.DtiPlan) error {
	m.dtiPlans[p.ID] = p
	return nil
}

func (m *mockRepo) FindDtiPlanByID(_ context.Context, id uuid.UUID) (*domain.DtiPlan, error) {
	p, ok := m.dtiPlans[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return p, nil
}

func (m *mockRepo) FindDtiPlansByDestination(_ context.Context, destinationID uuid.UUID) ([]*domain.DtiPlan, error) {
	var items []*domain.DtiPlan
	for _, p := range m.dtiPlans {
		if p.DestinationID == destinationID {
			items = append(items, p)
		}
	}
	return items, nil
}

func (m *mockRepo) UpdateDtiPlan(_ context.Context, p *domain.DtiPlan) error {
	m.dtiPlans[p.ID] = p
	return nil
}

func (m *mockRepo) DeleteDtiPlan(_ context.Context, id uuid.UUID) error {
	delete(m.dtiPlans, id)
	return nil
}

func (m *mockRepo) CountDtiPlanGoals(_ context.Context, dtiPlanID uuid.UUID) (int, error) {
	count := 0
	for _, g := range m.dtiPlanGoals {
		if g.DtiPlanID == dtiPlanID {
			count++
		}
	}
	return count, nil
}

// ── DtiPlanGoal stubs ──────────────────────────────────────────

func (m *mockRepo) CreateDtiPlanGoal(_ context.Context, g *domain.DtiPlanGoal) error {
	m.dtiPlanGoals[g.ID] = g
	return nil
}

func (m *mockRepo) UpdateDtiPlanGoal(_ context.Context, g *domain.DtiPlanGoal) error {
	m.dtiPlanGoals[g.ID] = g
	return nil
}

func (m *mockRepo) DeleteDtiPlanGoal(_ context.Context, id uuid.UUID) error {
	delete(m.dtiPlanGoals, id)
	return nil
}

func (m *mockRepo) ListDtiPlanGoals(_ context.Context, dtiPlanID uuid.UUID) ([]*domain.DtiPlanGoal, error) {
	var items []*domain.DtiPlanGoal
	for _, g := range m.dtiPlanGoals {
		if g.DtiPlanID == dtiPlanID {
			items = append(items, g)
		}
	}
	return items, nil
}

func (m *mockRepo) FindDtiPlanGoalByID(_ context.Context, id uuid.UUID) (*domain.DtiPlanGoal, error) {
	g, ok := m.dtiPlanGoals[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return g, nil
}

// ── Public Good Practices stub ─────────────────────────────────

func (m *mockRepo) FindApprovedGoodPractices(_ context.Context, _ map[string]string) ([]*domain.PublicGoodPracticeView, error) {
	// Build from the goodPractices map (keyed by actionID)
	var items []*domain.PublicGoodPracticeView
	for actionID, gp := range m.goodPractices {
		if gp.Status != domain.GpStatusApproved {
			continue
		}
		action, ok := m.actions[actionID]
		if !ok {
			continue
		}
		item := &domain.PublicGoodPracticeView{
			ActionID:         actionID,
			ActionName:       action.Name,
			ActionSummary:    action.Summary,
			ActionDescription: action.ExtendedDescription,
			DestinationName:  "Test Destination",
			Country:          "Test Country",
			Axes:             action.Axes,
			Scopes:           action.Scopes,
			ODS:              action.ODS,
			PhotoURL:         action.PhotoURL,
			WebsiteURL:       action.WebsiteURL,
			Awards:           action.Awards,
		}
		items = append(items, item)
	}
	return items, nil
}

func (m *mockRepo) FindApprovedGoodPracticeByActionID(_ context.Context, actionID uuid.UUID, locale string) (*domain.PublicGoodPracticeView, error) {
	return nil, sql.ErrNoRows
}

// ── Action CRUD stubs ──────────────────────────────────────────

func (m *mockRepo) CreateAction(_ context.Context, a *domain.Action) error {
	m.actions[a.ID] = a
	return nil
}

func (m *mockRepo) FindAllActions(_ context.Context) ([]*domain.Action, error) {
	var items []*domain.Action
	for _, a := range m.actions {
		items = append(items, a)
	}
	return items, nil
}

func (m *mockRepo) FindActionsByScope(_ context.Context, _ uuid.UUID) ([]*domain.Action, error) {
	return nil, nil
}

func (m *mockRepo) FindActionByID(_ context.Context, id uuid.UUID) (*domain.Action, error) {
	a, ok := m.actions[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return a, nil
}

func (m *mockRepo) FindActionsByDestination(_ context.Context, destID uuid.UUID) ([]*domain.Action, error) {
	var items []*domain.Action
	for _, a := range m.actions {
		if a.DestinationID == destID {
			items = append(items, a)
		}
	}
	return items, nil
}

func (m *mockRepo) UpdateAction(_ context.Context, a *domain.Action) error {
	m.actions[a.ID] = a
	return nil
}

func (m *mockRepo) DeleteAction(_ context.Context, id uuid.UUID) error {
	delete(m.actions, id)
	return nil
}

// ── ActionEvidence stubs ───────────────────────────────────────

func (m *mockRepo) CreateActionEvidence(_ context.Context, e *domain.ActionEvidence) error {
	m.evidence[e.ID] = e
	return nil
}

func (m *mockRepo) ListActionEvidence(_ context.Context, actionID uuid.UUID) ([]*domain.ActionEvidence, error) {
	var items []*domain.ActionEvidence
	for _, ev := range m.evidence {
		if ev.ActionID == actionID {
			items = append(items, ev)
		}
	}
	return items, nil
}

func (m *mockRepo) CountActionEvidence(_ context.Context, actionID uuid.UUID) (int, error) {
	count := 0
	for _, ev := range m.evidence {
		if ev.ActionID == actionID {
			count++
		}
	}
	return count, nil
}

func (m *mockRepo) FindActionEvidenceByID(_ context.Context, id uuid.UUID) (*domain.ActionEvidence, error) {
	ev, ok := m.evidence[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return ev, nil
}

func (m *mockRepo) DeleteActionEvidence(_ context.Context, id uuid.UUID) error {
	delete(m.evidence, id)
	return nil
}

// ── ActionIndicatorLink stubs ─────────────────────────────────

func (m *mockRepo) CreateActionIndicatorLink(_ context.Context, l *domain.ActionIndicatorLink) error {
	m.links[l.ID] = l
	return nil
}

func (m *mockRepo) DeleteActionIndicatorLink(_ context.Context, actionID, indicatorID, evaluationID uuid.UUID) error {
	for id, l := range m.links {
		if l.ActionID == actionID && l.IndicatorID == indicatorID && l.EvaluationID == evaluationID {
			delete(m.links, id)
			return nil
		}
	}
	return nil
}

func (m *mockRepo) ListActionIndicatorLinks(_ context.Context, actionID uuid.UUID) ([]*domain.ActionIndicatorLink, error) {
	var items []*domain.ActionIndicatorLink
	for _, l := range m.links {
		if l.ActionID == actionID {
			items = append(items, l)
		}
	}
	return items, nil
}

// ── Results ──────────────────────────────────────────────────────────

func (m *mockRepo) FindResults(_ context.Context, _ domain.ResultsFilters) ([]*domain.ResultsData, error) {
	return m.results, nil
}

// ── GoodPractice stubs ────────────────────────────────────────

func (m *mockRepo) CreateGoodPractice(_ context.Context, gp *domain.GoodPractice) error {
	m.goodPractices[gp.ActionID] = gp
	return nil
}

func (m *mockRepo) FindGoodPracticeByActionID(_ context.Context, actionID uuid.UUID) (*domain.GoodPractice, error) {
	gp, ok := m.goodPractices[actionID]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return gp, nil
}

func (m *mockRepo) UpdateGoodPractice(_ context.Context, gp *domain.GoodPractice) error {
	m.goodPractices[gp.ActionID] = gp
	return nil
}

func (m *mockRepo) CreateTranslation(_ context.Context, t *domain.ActionTranslation) error {
	m.translations[t.ID] = t
	return nil
}

func (m *mockRepo) FindTranslationByActionAndLocale(_ context.Context, actionID uuid.UUID, locale string) (*domain.ActionTranslation, error) {
	for _, t := range m.translations {
		if t.ActionID == actionID && t.Locale == locale {
			return t, nil
		}
	}
	return nil, sql.ErrNoRows
}

func (m *mockRepo) ListPendingTranslations(_ context.Context, locale string, reviewed *bool) ([]*domain.ActionTranslation, error) {
	var items []*domain.ActionTranslation
	for _, t := range m.translations {
		if locale != "" && t.Locale != locale {
			continue
		}
		if reviewed != nil && t.TranslationReviewed != *reviewed {
			continue
		}
		items = append(items, t)
	}
	return items, nil
}

func (m *mockRepo) UpdateTranslation(_ context.Context, t *domain.ActionTranslation) error {
	m.translations[t.ID] = t
	return nil
}

func (m *mockRepo) EnsureActionTranslation(_ context.Context, actionID uuid.UUID, locale, sourceName, sourceSummary, sourceDescription, sourceODS string) error {
	// For mock, just create a translation entry
	t := &domain.ActionTranslation{
		ID:            uuid.New(),
		ActionID:      actionID,
		Locale:        locale,
		Name:          sourceName,
		TranslatedAt:  time.Now(),
	}
	if sourceSummary != "" {
		t.Summary = &sourceSummary
	}
	if sourceDescription != "" {
		t.Description = &sourceDescription
	}
	if sourceODS != "" {
		t.ODS = json.RawMessage(sourceODS)
	}
	m.translations[t.ID] = t
	return nil
}

// FindLatestIndicatorValueByDestination stub for interface compliance
func (m *mockRepo) FindLatestIndicatorValueByDestination(_ context.Context, destinationID, indicatorID uuid.UUID) (*domain.IndicatorValue, error) {
	return nil, sql.ErrNoRows
}

// ── CatalogTranslation mocks ─────────────────────────────────────

func (m *mockRepo) CreateCatalogTranslation(_ context.Context, t *domain.CatalogTranslation) error {
	m.translationsCatalog[t.EntityID] = t
	return nil
}

func (m *mockRepo) FindCatalogTranslation(_ context.Context, entityType string, entityID uuid.UUID, locale string) (*domain.CatalogTranslation, error) {
	if t, ok := m.translationsCatalog[entityID]; ok && t.Locale == locale {
		return t, nil
	}
	return nil, sql.ErrNoRows
}

func (m *mockRepo) ListCatalogTranslations(_ context.Context, entityType, locale string, reviewed *bool) ([]*domain.CatalogTranslation, error) {
	var items []*domain.CatalogTranslation
	for _, t := range m.translationsCatalog {
		if t.EntityType == entityType && (locale == "" || t.Locale == locale) {
			if reviewed == nil || t.TranslationReviewed == *reviewed {
				items = append(items, t)
			}
		}
	}
	return items, nil
}

func (m *mockRepo) UpdateCatalogTranslation(_ context.Context, t *domain.CatalogTranslation) error {
	m.translationsCatalog[t.EntityID] = t
	return nil
}

// ═════════════════════════════════════════════════════════════════════
// B02 — Type Creation Rules
// ═════════════════════════════════════════════════════════════════════

func TestHandleCreateEvaluation_DiagnosticoRejectedWithoutClosedAutodiagnostico(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: no closed autodiagnostico for the destination (only an open one)
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeAutodiagnostico)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/",
		strings.NewReader(`{"destination_id":"`+testDestID.String()+`","name":"Test","type":"diagnostico"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleCreateEvaluation(ctx)
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
	if httpErr.Message != "promotion_required.autodiagnostico" {
		t.Errorf("expected 'promotion_required.autodiagnostico', got %v", httpErr.Message)
	}
}

func TestHandleCreateEvaluation_AuditoriaRejectedWithoutClosedDiagnostico(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: no closed diagnostico for the destination (only an autodiagnostico)
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAutodiagnostico)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/",
		strings.NewReader(`{"destination_id":"`+testDestID.String()+`","name":"Test","type":"auditoria"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleCreateEvaluation(ctx)
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
	if httpErr.Message != "promotion_required.diagnostico" {
		t.Errorf("expected 'promotion_required.diagnostico', got %v", httpErr.Message)
	}
}

func TestHandleCreateEvaluation_AutodiagnosticoAlwaysAllowed(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: no evaluations exist at all
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/",
		strings.NewReader(`{"destination_id":"`+testDestID.String()+`","name":"Test Auto","type":"autodiagnostico"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleCreateEvaluation(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	// Verify evaluation was created
	var created bool
	for _, e := range mock.evaluations {
		if e.Type == domain.EvaluationTypeAutodiagnostico && e.Name == "Test Auto" {
			created = true
			break
		}
	}
	if !created {
		t.Error("expected autodiagnostico evaluation to be created")
	}
}

func TestHandleCreateEvaluation_MedicionEspontaneaAlwaysAllowed(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: no evaluations exist at all
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/",
		strings.NewReader(`{"destination_id":"`+testDestID.String()+`","name":"Test Medicion","type":"medicion_espontanea"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleCreateEvaluation(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	// Verify evaluation was created
	var created bool
	for _, e := range mock.evaluations {
		if e.Type == domain.EvaluationTypeMedicionEspontanea && e.Name == "Test Medicion" {
			created = true
			break
		}
	}
	if !created {
		t.Error("expected medicion_espontanea evaluation to be created")
	}
}

// ═════════════════════════════════════════════════════════════════════
// B04 — ADMIN Implicit Access
// ═════════════════════════════════════════════════════════════════════

func TestHandleListEvaluationUsers_AdminRole_IncludesImplicitAdminEntries(t *testing.T) {
	mock := newMockRepo()
	mockUsers := &mockUsersClient{
		adminUsers: []AdminUser{
			{ID: uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name: "Admin One", Email: "admin1@test.com"},
			{ID: uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Name: "Admin Two", Email: "admin2@test.com"},
		},
	}
	uc := NewLogicWithFullDeps(mock, mockUsers)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	// Given: one explicit grant exists
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	mock.GrantAccess(context.Background(), testEvalID, testDestUserID, domain.AccessLevelCarga)

	// When: listing users
	err := uc.HandleListEvaluationUsers(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	var users []*domain.EvaluationUser
	if err := json.Unmarshal(rec.Body.Bytes(), &users); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	// Then: we should have 3 entries (1 explicit + 2 implicit)
	if len(users) != 3 {
		t.Fatalf("expected 3 users, got %d", len(users))
	}

	// Count implicit entries
	implicitCount := 0
	for _, u := range users {
		if u.IsImplicit {
			implicitCount++
			if u.UserName == "" {
				t.Error("expected implicit entry to have UserName")
			}
			if u.ID != nil {
				t.Error("expected implicit entry ID to be nil")
			}
			if u.AccessLevel != domain.AccessLevelAdministracion {
				t.Errorf("expected implicit access_level 'administracion', got %q", u.AccessLevel)
			}
		}
	}
	if implicitCount != 2 {
		t.Errorf("expected 2 implicit entries, got %d", implicitCount)
	}
}

func TestHandleListEvaluationUsers_NonAdmin_NoImplicitEntries(t *testing.T) {
	mock := newMockRepo()
	mockUsers := &mockUsersClient{
		adminUsers: []AdminUser{
			{ID: uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name: "Admin One", Email: "admin1@test.com"},
		},
	}
	uc := NewLogicWithFullDeps(mock, mockUsers)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "gestor_destino")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	// Given: an evaluation with explicit administracion access for this user
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	mock.GrantAccess(context.Background(), testEvalID, testDestUserID, domain.AccessLevelAdministracion)

	// When: listing users (non-admin caller)
	err := uc.HandleListEvaluationUsers(ctx)
	if err != nil {
		t.Fatalf("expected success, got: %v", err)
	}

	var users []*domain.EvaluationUser
	if err := json.Unmarshal(rec.Body.Bytes(), &users); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	// Then: only 1 explicit entry, no implicit entries
	for _, u := range users {
		if u.IsImplicit {
			t.Error("expected no implicit entries for non-admin caller")
		}
	}
}

// ═════════════════════════════════════════════════════════════════════
// B01 — Pagination Tests
// ═════════════════════════════════════════════════════════════════════

func TestHandleListEvaluations_PaginatedSlice_ReturnsCorrectSlice(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: 50 evaluations
	now := time.Now()
	for i := 0; i < 50; i++ {
		eval := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
		eval.ID = uuid.New()
		eval.CreatedAt = now.Add(-time.Duration(i) * time.Hour)
		mock.evaluations[eval.ID] = eval
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?limit=10&offset=0", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(resp.Data) != 10 {
		t.Errorf("expected 10 items, got %d", len(resp.Data))
	}
	if resp.Total != 50 {
		t.Errorf("expected total 50, got %d", resp.Total)
	}
	if resp.Limit != 10 {
		t.Errorf("expected limit 10, got %d", resp.Limit)
	}
	if resp.Offset != 0 {
		t.Errorf("expected offset 0, got %d", resp.Offset)
	}

	// Verify newest-first ordering
	for i := 1; i < len(resp.Data); i++ {
		if resp.Data[i].CreatedAt.After(resp.Data[i-1].CreatedAt) {
			t.Error("expected items ordered newest-first (created_at DESC)")
			break
		}
	}
}

func TestHandleListEvaluations_DefaultsWhenParamsOmitted(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: 30 evaluations
	now := time.Now()
	for i := 0; i < 30; i++ {
		eval := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
		eval.ID = uuid.New()
		eval.CreatedAt = now.Add(-time.Duration(i) * time.Hour)
		mock.evaluations[eval.ID] = eval
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(resp.Data) != 20 {
		t.Errorf("expected default 20 items, got %d", len(resp.Data))
	}
	if resp.Total != 30 {
		t.Errorf("expected total 30, got %d", resp.Total)
	}
	if resp.Limit != 20 {
		t.Errorf("expected default limit 20, got %d", resp.Limit)
	}
	if resp.Offset != 0 {
		t.Errorf("expected default offset 0, got %d", resp.Offset)
	}
}

func TestHandleListEvaluations_SecondPage_ReturnsCorrectOffset(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: 50 evaluations
	now := time.Now()
	for i := 0; i < 50; i++ {
		eval := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
		eval.ID = uuid.New()
		eval.CreatedAt = now.Add(-time.Duration(i) * time.Hour)
		mock.evaluations[eval.ID] = eval
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?limit=10&offset=10", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(resp.Data) != 10 {
		t.Errorf("expected 10 items, got %d", len(resp.Data))
	}
	if resp.Total != 50 {
		t.Errorf("expected total 50, got %d", resp.Total)
	}
	if resp.Limit != 10 {
		t.Errorf("expected limit 10, got %d", resp.Limit)
	}
	if resp.Offset != 10 {
		t.Errorf("expected offset 10, got %d", resp.Offset)
	}
}

func TestHandleListEvaluations_EmptyResult_ReturnsEmpty(t *testing.T) {
	uc, _, _, _ := setupTest(t)

	// Given: no evaluations
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(resp.Data) != 0 {
		t.Errorf("expected 0 items, got %d", len(resp.Data))
	}
	if resp.Total != 0 {
		t.Errorf("expected total 0, got %d", resp.Total)
	}
}

// ═════════════════════════════════════════════════════════════════════
// Role-based scoping — HandleListEvaluations
// ═════════════════════════════════════════════════════════════════════

// Additional test IDs for role-based scoping tests
var (
	testDestID2  = uuid.MustParse("11111111-1111-1111-1111-111111111112")
	testDestID3  = uuid.MustParse("11111111-1111-1111-1111-111111111113")
	testEvalID2  = uuid.MustParse("22222222-2222-2222-2222-222222222223")
	testEvalID3  = uuid.MustParse("22222222-2222-2222-2222-222222222224")
	testEvalID4  = uuid.MustParse("22222222-2222-2222-2222-222222222225")
	testEvalID5  = uuid.MustParse("22222222-2222-2222-2222-222222222226")
	testEvalID6  = uuid.MustParse("22222222-2222-2222-2222-222222222227")
	testRegionID = uuid.MustParse("33333333-3333-3333-3333-333333333331")
	testUserID   = uuid.MustParse("44444444-4444-4444-4444-444444444441")
)

func TestHandleListEvaluations_Admin_SeesAll(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now

	e2 := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeDiagnostico)
	e2.ID = testEvalID3
	e2.DestinationID = testDestID
	e2.CreatedAt = now.Add(-time.Hour)

	e3 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e3.ID = testEvalID4
	e3.DestinationID = testDestID2
	e3.CreatedAt = now.Add(-2 * time.Hour)

	mock.evaluations[e1.ID] = e1
	mock.evaluations[e2.ID] = e2
	mock.evaluations[e3.ID] = e3

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.Set("destination_id", nil)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 3 {
		t.Errorf("expected 3 items, got %d", len(resp.Data))
	}
	if resp.Total != 3 {
		t.Errorf("expected total 3, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_Admin_FilterByDest(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now

	e2 := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeDiagnostico)
	e2.ID = testEvalID3
	e2.DestinationID = testDestID
	e2.CreatedAt = now.Add(-time.Hour)

	e3 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e3.ID = testEvalID4
	e3.DestinationID = testDestID2
	e3.CreatedAt = now.Add(-2 * time.Hour)

	mock.evaluations[e1.ID] = e1
	mock.evaluations[e2.ID] = e2
	mock.evaluations[e3.ID] = e3

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?destination_id="+testDestID.String(), nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.Set("destination_id", nil)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 2 {
		t.Errorf("expected 2 items, got %d", len(resp.Data))
	}
	if resp.Total != 2 {
		t.Errorf("expected total 2, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_AdminDestino_OwnDest(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now

	e2 := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeDiagnostico)
	e2.ID = testEvalID3
	e2.DestinationID = testDestID
	e2.CreatedAt = now.Add(-time.Hour)

	e3 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e3.ID = testEvalID4
	e3.DestinationID = testDestID2
	e3.CreatedAt = now.Add(-2 * time.Hour)

	mock.evaluations[e1.ID] = e1
	mock.evaluations[e2.ID] = e2
	mock.evaluations[e3.ID] = e3

	destStr := testDestID.String()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin_destino")
	ctx.Set("destination_id", &destStr)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 2 {
		t.Errorf("expected 2 items, got %d", len(resp.Data))
	}
	if resp.Total != 2 {
		t.Errorf("expected total 2, got %d", resp.Total)
	}
	// Verify all items belong to the user's destination
	for _, item := range resp.Data {
		if item.DestinationID != testDestID {
			t.Errorf("expected destination %s, got %s", testDestID, item.DestinationID)
		}
	}
}

func TestHandleListEvaluations_AdminDestino_NoDest(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now
	mock.evaluations[e1.ID] = e1

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin_destino")
	ctx.Set("destination_id", nil)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 0 {
		t.Errorf("expected 0 items, got %d", len(resp.Data))
	}
	if resp.Total != 0 {
		t.Errorf("expected total 0, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_GestorDestino_OwnDest(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now

	e2 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e2.ID = testEvalID4
	e2.DestinationID = testDestID2
	e2.CreatedAt = now.Add(-2 * time.Hour)

	mock.evaluations[e1.ID] = e1
	mock.evaluations[e2.ID] = e2

	destStr := testDestID.String()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "gestor_destino")
	ctx.Set("destination_id", &destStr)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 1 {
		t.Errorf("expected 1 item, got %d", len(resp.Data))
	}
	if resp.Total != 1 {
		t.Errorf("expected total 1, got %d", resp.Total)
	}
	if resp.Data[0].DestinationID != testDestID {
		t.Errorf("expected destination %s, got %s", testDestID, resp.Data[0].DestinationID)
	}
}

func TestHandleListEvaluations_GestorRegional_WithRegion(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Two destinations in the same region
	dest1 := &domain.Destination{
		ID:       testDestID,
		Name:     "Destino 1",
		RegionID: &testRegionID,
	}
	dest2 := &domain.Destination{
		ID:       testDestID2,
		Name:     "Destino 2",
		RegionID: &testRegionID,
	}
	mock.destinations[dest1.ID] = dest1
	mock.destinations[dest2.ID] = dest2

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now

	e2 := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeDiagnostico)
	e2.ID = testEvalID3
	e2.DestinationID = testDestID
	e2.CreatedAt = now.Add(-time.Hour)

	e3 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e3.ID = testEvalID4
	e3.DestinationID = testDestID2
	e3.CreatedAt = now.Add(-2 * time.Hour)

	mock.evaluations[e1.ID] = e1
	mock.evaluations[e2.ID] = e2
	mock.evaluations[e3.ID] = e3

	destStr := testDestID.String()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "gestor_regional")
	ctx.Set("destination_id", &destStr)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 3 {
		t.Errorf("expected 3 items, got %d", len(resp.Data))
	}
	if resp.Total != 3 {
		t.Errorf("expected total 3, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_GestorRegional_NoRegion(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Destination with nil region
	dest := &domain.Destination{
		ID:       testDestID,
		Name:     "Destino Sin Region",
		RegionID: nil,
	}
	mock.destinations[dest.ID] = dest

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "gestor_regional")
	destStr := testDestID.String()
	ctx.Set("destination_id", &destStr)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 0 {
		t.Errorf("expected 0 items, got %d", len(resp.Data))
	}
	if resp.Total != 0 {
		t.Errorf("expected total 0, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_GestorNacional_SeesAll(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.DestinationID = testDestID
	e1.CreatedAt = now

	e2 := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeDiagnostico)
	e2.ID = testEvalID3
	e2.DestinationID = testDestID2
	e2.CreatedAt = now.Add(-time.Hour)

	mock.evaluations[e1.ID] = e1
	mock.evaluations[e2.ID] = e2

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "gestor_nacional")
	ctx.Set("destination_id", nil)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 2 {
		t.Errorf("expected 2 items, got %d", len(resp.Data))
	}
	if resp.Total != 2 {
		t.Errorf("expected total 2, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_Consultor_UserEvaluations(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	// autodiagnostico eval — consultor should see this
	e1 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e1.ID = testEvalID2
	e1.CreatedAt = now
	mock.evaluations[e1.ID] = e1
	mock.accessEntries[e1.ID.String()+":"+testUserID.String()] = domain.AccessLevelSoloLectura

	// diagnostico eval — consultor should see this
	e2 := createTestEvaluation(domain.EvaluationStatusEnCurso, domain.EvaluationTypeDiagnostico)
	e2.ID = testEvalID3
	e2.CreatedAt = now.Add(-time.Hour)
	mock.evaluations[e2.ID] = e2
	mock.accessEntries[e2.ID.String()+":"+testUserID.String()] = domain.AccessLevelCarga

	// auditoria eval — consultor should NOT see this (not in allowed types)
	e3 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e3.ID = testEvalID4
	e3.CreatedAt = now.Add(-2 * time.Hour)
	mock.evaluations[e3.ID] = e3
	mock.accessEntries[e3.ID.String()+":"+testUserID.String()] = domain.AccessLevelAdministracion

	// Another eval with NO access entry — should not appear
	e4 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e4.ID = testEvalID5
	e4.CreatedAt = now.Add(-3 * time.Hour)
	mock.evaluations[e4.ID] = e4

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testUserID.String())
	ctx.Set("role", "consultor")
	ctx.Set("destination_id", nil)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 2 {
		t.Errorf("expected 2 items, got %d", len(resp.Data))
	}
	if resp.Total != 2 {
		t.Errorf("expected total 2, got %d", resp.Total)
	}
}

func TestHandleListEvaluations_Auditor_UserEvaluations(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	now := time.Now()
	// auditoria eval — auditor should see this
	e1 := createTestEvaluation(domain.EvaluationStatusCerrada, domain.EvaluationTypeAuditoria)
	e1.ID = testEvalID2
	e1.CreatedAt = now
	mock.evaluations[e1.ID] = e1
	mock.accessEntries[e1.ID.String()+":"+testUserID.String()] = domain.AccessLevelAdministracion

	// autodiagnostico eval — auditor should NOT see this (not in allowed types)
	e2 := createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)
	e2.ID = testEvalID3
	e2.CreatedAt = now.Add(-time.Hour)
	mock.evaluations[e2.ID] = e2
	mock.accessEntries[e2.ID.String()+":"+testUserID.String()] = domain.AccessLevelSoloLectura

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testUserID.String())
	ctx.Set("role", "auditor")
	ctx.Set("destination_id", nil)

	err := uc.HandleListEvaluations(ctx)
	if err != nil {
		t.Fatalf("HandleListEvaluations: %v", err)
	}

	var resp PaginatedEvaluationsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(resp.Data) != 1 {
		t.Errorf("expected 1 item, got %d", len(resp.Data))
	}
	if resp.Total != 1 {
		t.Errorf("expected total 1, got %d", resp.Total)
	}
	if resp.Data[0].Type != domain.EvaluationTypeAuditoria {
		t.Errorf("expected type auditoria, got %s", resp.Data[0].Type)
	}
}

// ═════════════════════════════════════════════════════════════════════
// B08 — NotifyDestination Role Check
// ═════════════════════════════════════════════════════════════════════

func TestHandleNotifyDestination_AdminDestino_CanNotify(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: an evaluation exists
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "admin_destino")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	// When: admin_destino calls notify
	err := uc.HandleNotifyDestination(ctx)
	if err != nil {
		t.Fatalf("expected success for admin_destino, got: %v", err)
	}
	if rec.Code != http.StatusOK && rec.Code != 0 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHandleNotifyDestination_AdminGlobal_CanNotify(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: an evaluation exists (admin already set in setupTest)
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testAdminUserID.String())
	ctx.Set("role", "admin")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	// When: admin_global calls notify
	err := uc.HandleNotifyDestination(ctx)
	if err != nil {
		t.Fatalf("expected success for admin, got: %v", err)
	}
	if rec.Code != http.StatusOK && rec.Code != 0 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestHandleNotifyDestination_NonAdmin_Returns403(t *testing.T) {
	uc, mock, _, _ := setupTest(t)

	// Given: an evaluation exists
	mock.evaluations[testEvalID] = createTestEvaluation(domain.EvaluationStatusBorrador, domain.EvaluationTypeAutodiagnostico)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", testDestUserID.String())
	ctx.Set("role", "evaluador")
	ctx.SetParamNames("id")
	ctx.SetParamValues(testEvalID.String())

	// When: non-admin calls notify
	err := uc.HandleNotifyDestination(ctx)
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

// ── Helpers ──────────────────────────────────────────────────────────

func intPtr(i int) *int {
	return &i
}

// Ensure mockRepo implements domain.Repository
var _ domain.Repository = (*mockRepo)(nil)
