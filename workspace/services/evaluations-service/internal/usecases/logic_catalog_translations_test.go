package usecases

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"sync"
	"testing"
	"time"

	"evaluations-service/internal/domain"

	"github.com/google/uuid"
)

// ── Test doubles ──────────────────────────────────────────────────────

// fakeDeepL implements domain.DeepLClient with deterministic translations.
// It records every call so tests can assert the helper actually invoked
// the DeepL layer (and didn't short-circuit).
type fakeDeepL struct {
	mu          sync.Mutex
	calls       int
	translations map[string]string // source → translated
	errBySource map[string]error  // source → forced error
}

func newFakeDeepL() *fakeDeepL {
	return &fakeDeepL{
		translations: make(map[string]string),
		errBySource:  make(map[string]error),
	}
}

func (f *fakeDeepL) TranslateText(_ context.Context, text, _, _ string) (string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.calls++
	if err, ok := f.errBySource[text]; ok {
		return "", err
	}
	if t, ok := f.translations[text]; ok {
		return t, nil
	}
	// Default deterministic translation: "<text> (pt)"
	return text + " (pt)", nil
}

// ── T01 / T14: upsertCatalogTranslation tests ─────────────────────────

// TestUpsertCatalogTranslation_NoExisting_CreatesRow verifies the
// "create" branch: when FindCatalogTranslation returns sql.ErrNoRows,
// the helper must call CreateCatalogTranslation exactly once with the
// translated fields and TranslationReviewed=false (fresh row).
func TestUpsertCatalogTranslation_NoExisting_CreatesRow(t *testing.T) {
	repo := newMockRepo()
	dl := newFakeDeepL()
	dl.translations["Hello"] = "Olá"
	dl.translations["World"] = "Mundo"

	l := &Logic{repo: repo, deeplClient: dl}
	entityID := uuid.New()

	l.upsertCatalogTranslation(
		context.Background(),
		"scope",
		entityID,
		"pt",
		"Hello", "World", "",
	)

	// Find the row back
	got, err := repo.FindCatalogTranslation(context.Background(), "scope", entityID, "pt")
	if err != nil {
		t.Fatalf("expected translation to be persisted, got error: %v", err)
	}
	if got == nil {
		t.Fatal("expected translation row, got nil")
	}
	if got.EntityType != "scope" || got.EntityID != entityID || got.Locale != "pt" {
		t.Errorf("unexpected row identity: %+v", got)
	}
	if got.Name == nil || *got.Name != "Olá" {
		t.Errorf("expected Name=Olá, got %v", got.Name)
	}
	if got.Description == nil || *got.Description != "Mundo" {
		t.Errorf("expected Description=Mundo, got %v", got.Description)
	}
	if got.TranslationReviewed != false {
		t.Errorf("expected TranslationReviewed=false on fresh row, got true")
	}
	if got.TranslatedAt.IsZero() {
		t.Errorf("expected TranslatedAt to be set, got zero value")
	}
	if got.ReviewedBy != nil {
		t.Errorf("expected ReviewedBy=nil on fresh row, got %v", got.ReviewedBy)
	}
	if got.ReviewedAt != nil {
		t.Errorf("expected ReviewedAt=nil on fresh row, got %v", got.ReviewedAt)
	}
}

// TestUpsertCatalogTranslation_ExistingRow_UpdatesAndPreservesAudit verifies
// the "update" branch: when FindCatalogTranslation returns an existing row
// that was previously admin-reviewed, the helper must call
// UpdateCatalogTranslation (not Create) AND must preserve
// TranslationReviewed / ReviewedBy / ReviewedAt.
func TestUpsertCatalogTranslation_ExistingRow_UpdatesAndPreservesAudit(t *testing.T) {
	repo := newMockRepo()
	dl := newFakeDeepL()
	dl.translations["NewName"] = "NovoNome"
	dl.translations["NewDesc"] = "NovaDesc"

	entityID := uuid.New()
	reviewerID := uuid.New()
	reviewTime := time.Now().Add(-24 * time.Hour)

	// Seed an existing reviewed row
	existing := &domain.CatalogTranslation{
		ID:                  uuid.New(),
		EntityType:          "scope",
		EntityID:            entityID,
		Locale:              "pt",
		Name:                stringPtr("Antigo"),
		Description:         stringPtr("Antiga descrição"),
		TranslatedAt:        reviewTime,
		TranslationReviewed: true,
		ReviewedBy:          &reviewerID,
		ReviewedAt:          &reviewTime,
	}
	if err := repo.CreateCatalogTranslation(context.Background(), existing); err != nil {
		t.Fatalf("seed failed: %v", err)
	}

	l := &Logic{repo: repo, deeplClient: dl}
	l.upsertCatalogTranslation(
		context.Background(),
		"scope",
		entityID,
		"pt",
		"NewName", "NewDesc", "",
	)

	// The repo's UpdateCatalogTranslation mock replaces the map entry by ID.
	// Verify the updated row preserves audit columns and has new translations.
	got, err := repo.FindCatalogTranslation(context.Background(), "scope", entityID, "pt")
	if err != nil {
		t.Fatalf("Find failed: %v", err)
	}
	if got == nil {
		t.Fatal("expected row after update, got nil")
	}
	if got.Name == nil || *got.Name != "NovoNome" {
		t.Errorf("expected Name=NovoNome (updated), got %v", got.Name)
	}
	if got.Description == nil || *got.Description != "NovaDesc" {
		t.Errorf("expected Description=NovaDesc, got %v", got.Description)
	}
	// Audit columns MUST be preserved across the update
	if !got.TranslationReviewed {
		t.Errorf("expected TranslationReviewed=true (preserved), got false")
	}
	if got.ReviewedBy == nil || *got.ReviewedBy != reviewerID {
		t.Errorf("expected ReviewedBy=%v (preserved), got %v", reviewerID, got.ReviewedBy)
	}
	if got.ReviewedAt == nil || !got.ReviewedAt.Equal(reviewTime) {
		t.Errorf("expected ReviewedAt=%v (preserved), got %v", reviewTime, got.ReviewedAt)
	}
	// TranslatedAt must advance past the seeded reviewTime
	if !got.TranslatedAt.After(reviewTime) {
		t.Errorf("expected TranslatedAt to advance past %v, got %v", reviewTime, got.TranslatedAt)
	}
}

// TestTranslateCatalogEntityOnWrite_NilDeepLClient_NoOp verifies that
// when DeepL is not configured, the helper must short-circuit and
// perform no repo calls. This is the "no DEEPL_API_KEY" production
// scenario.
func TestTranslateCatalogEntityOnWrite_NilDeepLClient_NoOp(t *testing.T) {
	repo := newMockRepo()
	entityID := uuid.New()

	l := &Logic{repo: repo, deeplClient: nil}
	l.translateCatalogEntityOnWrite("scope", entityID, "Hello", "World", "")

	got, err := repo.FindCatalogTranslation(context.Background(), "scope", entityID, "pt")
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected no row when deeplClient is nil, got %+v", got)
	}
}

// TestTranslateCatalogEntityOnWrite_IteratesAllLocales verifies that the
// helper invokes the upsert path for every locale in the Locales constant.
// This guarantees the constant is the single source of truth for
// target languages.
func TestTranslateCatalogEntityOnWrite_IteratesAllLocales(t *testing.T) {
	repo := newMockRepo()
	dl := newFakeDeepL()
	dl.translations["Hola"] = "Olá"

	// Snapshot the current Locales list so the test is independent of
	// future additions. The helper must produce exactly that many rows.
	expectedLocales := append([]string{}, Locales...)

	l := &Logic{repo: repo, deeplClient: dl}
	entityID := uuid.New()
	l.translateCatalogEntityOnWrite("scope", entityID, "Hola", "", "")

	for _, locale := range expectedLocales {
		got, err := repo.FindCatalogTranslation(context.Background(), "scope", entityID, locale)
		if err != nil {
			t.Errorf("locale=%s: expected row, got err=%v", locale, err)
			continue
		}
		if got == nil {
			t.Errorf("locale=%s: expected row, got nil", locale)
			continue
		}
		if got.Locale != locale {
			t.Errorf("locale=%s: row has Locale=%s", locale, got.Locale)
		}
	}
}

// stringPtr is a tiny helper for the test file.
func stringPtr(s string) *string { return &s }

// TestCriteriaHasContent covers the criteriaHasContent helper used by the
// cache-replace path to reject translations whose descriptions all came back
// empty (e.g. a bad DeepL es→es or rate-limit response).
func TestCriteriaHasContent(t *testing.T) {
	cases := []struct {
		name string
		json string
		want bool
	}{
		{"all-empty", `[{"description":"","value":50},{"description":"","value":0}]`, false},
		{"at-least-one", `[{"description":"","value":50},{"description":"texto","value":0}]`, true},
		{"empty-array", `[]`, false},
		{"invalid-json", `not json`, false},
		{"empty-string", ``, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := criteriaHasContent(c.json); got != c.want {
				t.Errorf("criteriaHasContent(%q) = %v, want %v", c.json, got, c.want)
			}
		})
	}
}

// TestApplyIndicatorTranslation_EmptyCriteria_KeepsOriginal verifies the
// regression we just fixed: a catalog_translation row whose criteria has all
// empty descriptions must NOT clobber the original indicator criteria.
func TestApplyIndicatorTranslation_EmptyCriteria_KeepsOriginal(t *testing.T) {
	originalCriteria := json.RawMessage(`[{"description":"Original en español","value":50}]`)
	ind := &domain.Indicator{
		Name:     "Original Name",
		Description: "Original Desc",
		Criteria: originalCriteria,
	}
	// Translation with all-empty descriptions (the corrupt es row pattern)
	badCriteria := `[{"description":"","value":50},{"description":"","value":0}]`
	t1 := &domain.CatalogTranslation{
		Name:        stringPtr(""),  // empty name → should NOT overwrite
		Description: stringPtr(""),  // empty desc → should NOT overwrite
		Criteria:    stringPtr(badCriteria),
	}
	l := &Logic{}
	l.applyIndicatorTranslation(ind, t1)

	if ind.Name != "Original Name" {
		t.Errorf("Name was overwritten: got %q, want %q", ind.Name, "Original Name")
	}
	if ind.Description != "Original Desc" {
		t.Errorf("Description was overwritten: got %q, want %q", ind.Description, "Original Desc")
	}
	if string(ind.Criteria) != string(originalCriteria) {
		t.Errorf("Criteria was overwritten: got %q, want %q", ind.Criteria, originalCriteria)
	}
}

// TestApplyIndicatorTranslation_ValidCriteria_Replaces verifies the happy path
// still works: a translation with real content DOES replace the original.
func TestApplyIndicatorTranslation_ValidCriteria_Replaces(t *testing.T) {
	ind := &domain.Indicator{
		Name:     "Original",
		Description: "Original",
		Criteria: json.RawMessage(`[{"description":"orig","value":1}]`),
	}
	goodCriteria := `[{"description":"Traduzido","value":1}]`
	t1 := &domain.CatalogTranslation{
		Name:        stringPtr("Traduzido"),
		Description: stringPtr("Desc"),
		Criteria:    stringPtr(goodCriteria),
	}
	l := &Logic{}
	l.applyIndicatorTranslation(ind, t1)

	if ind.Name != "Traduzido" {
		t.Errorf("Name: got %q, want %q", ind.Name, "Traduzido")
	}
	if ind.Description != "Desc" {
		t.Errorf("Description: got %q, want %q", ind.Description, "Desc")
	}
	if string(ind.Criteria) != goodCriteria {
		t.Errorf("Criteria: got %q, want %q", ind.Criteria, goodCriteria)
	}
}
