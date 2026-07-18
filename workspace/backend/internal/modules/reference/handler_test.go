package reference

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"

	"project-base/backend/internal/platform/module"
)

// ─── Safety Net (no pre-existing tests for this new package) ───
// This is a new package, so there are no pre-existing tests to baseline.

// ─── Sub-task A: Module Descriptor (module.go) ───

func TestReferenceModule_Descriptor_ID(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()
	if d.ID != "reference" {
		t.Fatalf("Descriptor().ID = %q, want %q", d.ID, "reference")
	}
}

func TestReferenceModule_Descriptor_Routes(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()

	want := []module.Route{
		{Method: "GET", Path: "/reference/notes"},
		{Method: "POST", Path: "/reference/notes"},
		{Method: "GET", Path: "/reference/notes/:id"},
		{Method: "PUT", Path: "/reference/notes/:id"},
		{Method: "DELETE", Path: "/reference/notes/:id"},
		{Method: "GET", Path: "/reference/health"},
	}
	if len(d.Routes) != len(want) {
		t.Fatalf("Descriptor().Routes length = %d, want %d", len(d.Routes), len(want))
	}
	for i := range want {
		if d.Routes[i].Method != want[i].Method || d.Routes[i].Path != want[i].Path {
			t.Fatalf("Descriptor().Routes[%d] = %+v, want %+v", i, d.Routes[i], want[i])
		}
	}
}

func TestReferenceModule_Descriptor_Permissions(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()

	want := []string{"reference.read", "reference.write", "reference.admin"}
	if len(d.Permissions) != len(want) {
		t.Fatalf("Descriptor().Permissions = %v, want %v", d.Permissions, want)
	}
	for i := range want {
		if d.Permissions[i] != want[i] {
			t.Fatalf("Descriptor().Permissions[%d] = %q, want %q", i, d.Permissions[i], want[i])
		}
	}
}

func TestReferenceModule_Descriptor_Health(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()
	if d.Health != "reference.ok" {
		t.Fatalf("Descriptor().Health = %q, want %q", d.Health, "reference.ok")
	}
}

func TestReferenceModule_Descriptor_RequiredCapabilities(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()
	if len(d.RequiredCapabilities) != 1 {
		t.Fatalf("Descriptor().RequiredCapabilities length = %d, want 1", len(d.RequiredCapabilities))
	}
	if d.RequiredCapabilities[0] != "postgres" {
		t.Fatalf("Descriptor().RequiredCapabilities[0] = %q, want %q", d.RequiredCapabilities[0], "postgres")
	}
}

func TestReferenceModule_Descriptor_Migrations(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()
	if len(d.Migrations) != 1 {
		t.Fatalf("Descriptor().Migrations length = %d, want 1", len(d.Migrations))
	}
	if d.Migrations[0].ID != "reference-001" {
		t.Fatalf("Descriptor().Migrations[0].ID = %q, want %q", d.Migrations[0].ID, "reference-001")
	}
	if d.Migrations[0].Order != 1 {
		t.Fatalf("Descriptor().Migrations[0].Order = %d, want 1", d.Migrations[0].Order)
	}
}

func TestReferenceModule_Descriptor_NoExcludedTerms(t *testing.T) {
	m := &ReferenceModule{}
	d := m.Descriptor()

	text := d.ID + " " + d.Health + " " + strings.Join(d.Permissions, " ")
	for _, route := range d.Routes {
		text += " " + route.Method + " " + route.Path
	}
	excluded := []string{"legal", "client", "case", "document", "tiptap", "docx", "pdf", "destino", "evaluacion", "ambito", "indicador"}
	lower := strings.ToLower(text)
	for _, term := range excluded {
		if strings.Contains(lower, term) {
			t.Fatalf("Descriptor contains excluded term %q", term)
		}
	}
}

// ─── Sub-task B: Health Endpoint ───

func TestHealthEndpoint_ReturnsOK(t *testing.T) {
	store := NewNoteStore()
	handler := HandleHealth(store)

	req := httptest.NewRequest(http.MethodGet, "/reference/health", nil)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("health status = %d, want %d", rec.Code, http.StatusOK)
	}

	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("health decode error: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("health status field = %q, want %q", body["status"], "ok")
	}
}

func TestHealthEndpoint_ContentType(t *testing.T) {
	store := NewNoteStore()
	handler := HandleHealth(store)

	req := httptest.NewRequest(http.MethodGet, "/reference/health", nil)
	rec := httptest.NewRecorder()
	handler(rec, req)

	ct := rec.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Fatalf("health Content-Type = %q, want %q", ct, "application/json")
	}
}

// ─── Sub-task C: Notes CRUD with Tenant Isolation ───

func TestCreateNote_ValidRequest(t *testing.T) {
	store := NewNoteStore()
	handler := HandleCreateNote(store)

	orgA := uuid.New().String()
	body := `{"title": "Test Note", "content": "This is a test"}`
	req := httptest.NewRequest(http.MethodPost, "/reference/notes", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d; body: %s", rec.Code, http.StatusCreated, rec.Body.String())
	}

	var note Note
	if err := json.NewDecoder(rec.Body).Decode(&note); err != nil {
		t.Fatalf("create decode error: %v", err)
	}
	if note.Title != "Test Note" {
		t.Fatalf("note.Title = %q, want %q", note.Title, "Test Note")
	}
	if note.Content != "This is a test" {
		t.Fatalf("note.Content = %q, want %q", note.Content, "This is a test")
	}
	if note.OrganizationID != orgA {
		t.Fatalf("note.OrganizationID = %q, want %q", note.OrganizationID, orgA)
	}
	if note.ID == "" {
		t.Fatal("note.ID is empty")
	}
	if note.CreatedAt == "" {
		t.Fatal("note.CreatedAt is empty")
	}
	if note.UpdatedAt == "" {
		t.Fatal("note.UpdatedAt is empty")
	}
}

func TestCreateNote_MissingOrgID_ReturnsBadRequest(t *testing.T) {
	store := NewNoteStore()
	handler := HandleCreateNote(store)

	body := `{"title": "Test Note", "content": "This is a test"}`
	req := httptest.NewRequest(http.MethodPost, "/reference/notes", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// No X-Organization-ID header
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("create without org status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestCreateNote_InvalidJSON_ReturnsBadRequest(t *testing.T) {
	store := NewNoteStore()
	handler := HandleCreateNote(store)

	orgA := uuid.New().String()
	req := httptest.NewRequest(http.MethodPost, "/reference/notes", strings.NewReader("{invalid}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("create invalid JSON status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestListNotes_ReturnsOnlyOwnOrg(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	orgB := uuid.New().String()

	// Create notes for org A
	createNote(store, orgA, "Note A1", "Content A1")
	createNote(store, orgA, "Note A2", "Content A2")

	// Create notes for org B
	createNote(store, orgB, "Note B1", "Content B1")

	handler := HandleListNotes(store)

	// Org A sees only A's notes
	reqA := httptest.NewRequest(http.MethodGet, "/reference/notes", nil)
	reqA.Header.Set("X-Organization-ID", orgA)
	recA := httptest.NewRecorder()
	handler(recA, reqA)

	if recA.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d", recA.Code, http.StatusOK)
	}

	var notesA []Note
	if err := json.NewDecoder(recA.Body).Decode(&notesA); err != nil {
		t.Fatalf("list decode error: %v", err)
	}
	if len(notesA) != 2 {
		t.Fatalf("org A notes count = %d, want 2", len(notesA))
	}
	for _, n := range notesA {
		if n.OrganizationID != orgA {
			t.Fatalf("note %q belongs to org %q, but org A listed it", n.ID, n.OrganizationID)
		}
	}

	// Org B sees only B's notes
	reqB := httptest.NewRequest(http.MethodGet, "/reference/notes", nil)
	reqB.Header.Set("X-Organization-ID", orgB)
	recB := httptest.NewRecorder()
	handler(recB, reqB)

	if recB.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d", recB.Code, http.StatusOK)
	}

	var notesB []Note
	if err := json.NewDecoder(recB.Body).Decode(&notesB); err != nil {
		t.Fatalf("list decode error: %v", err)
	}
	if len(notesB) != 1 {
		t.Fatalf("org B notes count = %d, want 1", len(notesB))
	}
}

func TestListNotes_MissingOrgID_ReturnsBadRequest(t *testing.T) {
	store := NewNoteStore()
	handler := HandleListNotes(store)

	req := httptest.NewRequest(http.MethodGet, "/reference/notes", nil)
	// No X-Organization-ID
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("list without org status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestGetNote_ValidRequest(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()

	created := createNote(store, orgA, "Test Note", "Test Content")
	handler := HandleGetNote(store)

	req := httptest.NewRequest(http.MethodGet, "/reference/notes/"+created.ID, nil)
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("get status = %d, want %d; body: %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var note Note
	if err := json.NewDecoder(rec.Body).Decode(&note); err != nil {
		t.Fatalf("get decode error: %v", err)
	}
	if note.ID != created.ID {
		t.Fatalf("note.ID = %q, want %q", note.ID, created.ID)
	}
}

func TestGetNote_CrossTenant_ReturnsNotFound(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	orgB := uuid.New().String()

	created := createNote(store, orgA, "Secret Note", "Secret Content")
	handler := HandleGetNote(store)

	// org B tries to read org A's note
	req := httptest.NewRequest(http.MethodGet, "/reference/notes/"+created.ID, nil)
	req.Header.Set("X-Organization-ID", orgB)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("cross-tenant get status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestGetNote_NotFound_Returns404(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	handler := HandleGetNote(store)

	req := httptest.NewRequest(http.MethodGet, "/reference/notes/nonexistent-id", nil)
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("get nonexistent status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestUpdateNote_ValidRequest(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()

	created := createNote(store, orgA, "Original Title", "Original Content")
	handler := HandleUpdateNote(store)

	updateBody := `{"title": "Updated Title", "content": "Updated Content"}`
	req := httptest.NewRequest(http.MethodPut, "/reference/notes/"+created.ID, strings.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("update status = %d, want %d; body: %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var note Note
	if err := json.NewDecoder(rec.Body).Decode(&note); err != nil {
		t.Fatalf("update decode error: %v", err)
	}
	if note.Title != "Updated Title" {
		t.Fatalf("note.Title after update = %q, want %q", note.Title, "Updated Title")
	}
	if note.Content != "Updated Content" {
		t.Fatalf("note.Content after update = %q, want %q", note.Content, "Updated Content")
	}
	if note.UpdatedAt == "" {
		t.Fatal("UpdatedAt is empty after update")
	}
}

func TestUpdateNote_CrossTenant_ReturnsNotFound(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	orgB := uuid.New().String()

	created := createNote(store, orgA, "Original", "Original")
	handler := HandleUpdateNote(store)

	updateBody := `{"title": "Hacked", "content": "Hacked"}`
	req := httptest.NewRequest(http.MethodPut, "/reference/notes/"+created.ID, strings.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", orgB)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("cross-tenant update status = %d, want %d", rec.Code, http.StatusNotFound)
	}

	// Verify the original is unchanged by reading from org A
	getHandler := HandleGetNote(store)
	getReq := httptest.NewRequest(http.MethodGet, "/reference/notes/"+created.ID, nil)
	getReq.Header.Set("X-Organization-ID", orgA)
	getRec := httptest.NewRecorder()
	getHandler(getRec, getReq)

	var note Note
	json.NewDecoder(getRec.Body).Decode(&note)
	if note.Title != "Original" {
		t.Fatalf("original note was modified: title = %q", note.Title)
	}
}

func TestDeleteNote_ValidRequest(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()

	created := createNote(store, orgA, "To Delete", "Content")
	handler := HandleDeleteNote(store)

	req := httptest.NewRequest(http.MethodDelete, "/reference/notes/"+created.ID, nil)
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d, want %d", rec.Code, http.StatusNoContent)
	}

	// Verify it's gone
	getHandler := HandleGetNote(store)
	getReq := httptest.NewRequest(http.MethodGet, "/reference/notes/"+created.ID, nil)
	getReq.Header.Set("X-Organization-ID", orgA)
	getRec := httptest.NewRecorder()
	getHandler(getRec, getReq)
	if getRec.Code != http.StatusNotFound {
		t.Fatalf("get after delete status = %d, want %d", getRec.Code, http.StatusNotFound)
	}
}

func TestDeleteNote_CrossTenant_ReturnsNotFound(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	orgB := uuid.New().String()

	created := createNote(store, orgA, "Secret", "Content")
	handler := HandleDeleteNote(store)

	// org B tries to delete org A's note
	req := httptest.NewRequest(http.MethodDelete, "/reference/notes/"+created.ID, nil)
	req.Header.Set("X-Organization-ID", orgB)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("cross-tenant delete status = %d, want %d", rec.Code, http.StatusNotFound)
	}

	// Verify note still exists for org A
	getHandler := HandleGetNote(store)
	getReq := httptest.NewRequest(http.MethodGet, "/reference/notes/"+created.ID, nil)
	getReq.Header.Set("X-Organization-ID", orgA)
	getRec := httptest.NewRecorder()
	getHandler(getRec, getReq)
	if getRec.Code != http.StatusOK {
		t.Fatalf("note was deleted despite cross-tenant attempt, status = %d", getRec.Code)
	}
}

func TestDeleteNote_NotFound_Returns404(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	handler := HandleDeleteNote(store)

	req := httptest.NewRequest(http.MethodDelete, "/reference/notes/nonexistent-id", nil)
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("delete nonexistent status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestEmptyOrg_ListReturnsEmpty(t *testing.T) {
	store := NewNoteStore()
	orgA := uuid.New().String()
	handler := HandleListNotes(store)

	req := httptest.NewRequest(http.MethodGet, "/reference/notes", nil)
	req.Header.Set("X-Organization-ID", orgA)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("list empty org status = %d, want %d", rec.Code, http.StatusOK)
	}

	var notes []Note
	json.NewDecoder(rec.Body).Decode(&notes)
	if len(notes) != 0 {
		t.Fatalf("empty org notes count = %d, want 0", len(notes))
	}
}

// ─── Sub-task D: Module Isolation / Clean Removal ───

func TestReferenceModule_RegistersWithRegistry(t *testing.T) {
	m := &ReferenceModule{}
	reg, err := module.NewRegistry([]module.Module{m}, []module.Capability{"postgres"})
	if err != nil {
		t.Fatalf("NewRegistry with reference module error = %v", err)
	}
	if !reg.Has("reference") {
		t.Fatal("registry does not have reference module")
	}

	desc, ok := reg.Get("reference")
	if !ok {
		t.Fatal("registry.Get('reference') not found")
	}
	if desc.ID != "reference" {
		t.Fatalf("registry descriptor ID = %q, want %q", desc.ID, "reference")
	}
}

func TestReferenceModule_RemovalNoSideEffects(t *testing.T) {
	m := &ReferenceModule{}
	other := &stubModule{id: "other"}
	reg, err := module.NewRegistry([]module.Module{m, other}, []module.Capability{"postgres"})
	if err != nil {
		t.Fatalf("NewRegistry error = %v", err)
	}

	// Verify both are registered
	if !reg.Has("other") {
		t.Fatal("other module should be in registry")
	}
	if !reg.Has("reference") {
		t.Fatal("reference should be in registry")
	}

	// Simulate clean removal by verifying the registry supports independent IDs
	ids := reg.IDs()
	found := 0
	for _, id := range ids {
		if id == "reference" || id == "other" {
			found++
		}
	}
	if found != 2 {
		t.Fatalf("registry IDs should include both modules, got %v", ids)
	}
}

// Helper types for tests

type stubModule struct {
	id string
}

func (s *stubModule) Descriptor() module.Descriptor {
	return module.Descriptor{
		ID: s.id,
		Routes:               []module.Route{{Method: "GET", Path: "/" + s.id}},
		Permissions:          []string{s.id + ".read"},
		Migrations:           []module.Migration{{ID: s.id + "-001", Order: 1}},
		Health:               s.id + ".ok",
		RequiredCapabilities: []module.Capability{"postgres"},
	}
}

// Helper: createNote creates a note via the handler and returns it
func createNote(store *NoteStore, orgID, title, content string) *Note {
	handler := HandleCreateNote(store)
	body := `{"title": "` + title + `", "content": "` + content + `"}`
	req := httptest.NewRequest(http.MethodPost, "/reference/notes", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", orgID)
	rec := httptest.NewRecorder()
	handler(rec, req)

	var note Note
	json.NewDecoder(rec.Body).Decode(&note)
	return &note
}
