package reference

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Note represents a tenant-scoped note.
type Note struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	Content        string `json:"content"`
	OrganizationID string `json:"organization_id"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}

// NoteStore is an in-memory store for notes with tenant isolation.
type NoteStore struct {
	mu    sync.RWMutex
	notes map[string]*Note
}

// NewNoteStore creates a new empty note store.
func NewNoteStore() *NoteStore {
	return &NoteStore{
		notes: make(map[string]*Note),
	}
}

// orgID extracts the organization ID from the request header.
// Returns empty string if not present.
func orgID(r *http.Request) string {
	return r.Header.Get("X-Organization-ID")
}

// requireOrg returns the organization ID or writes a 400 response and returns false.
func requireOrg(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := orgID(r)
	if id == "" {
		http.Error(w, `{"error":"organization_id required"}`, http.StatusBadRequest)
		return "", false
	}
	return id, true
}

// writeJSON writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// HandleHealth returns a handler that responds with health status.
func HandleHealth(store *NoteStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

// HandleListNotes returns a handler that lists notes for the requesting organization.
func HandleListNotes(store *NoteStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := requireOrg(w, r)
		if !ok {
			return
		}

		store.mu.RLock()
		result := make([]Note, 0)
		for _, note := range store.notes {
			if note.OrganizationID == id {
				result = append(result, *note)
			}
		}
		store.mu.RUnlock()

		writeJSON(w, http.StatusOK, result)
	}
}

// HandleCreateNote returns a handler that creates a new note.
func HandleCreateNote(store *NoteStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := requireOrg(w, r)
		if !ok {
			return
		}

		var input struct {
			Title   string `json:"title"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
			return
		}

		now := time.Now().UTC().Format(time.RFC3339)
		note := &Note{
			ID:             uuid.New().String(),
			Title:          input.Title,
			Content:        input.Content,
			OrganizationID: id,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		store.mu.Lock()
		store.notes[note.ID] = note
		store.mu.Unlock()

		writeJSON(w, http.StatusCreated, note)
	}
}

// noteID extracts the note ID from the URL path after "/reference/notes/".
func noteID(path string) string {
	// path = "/reference/notes/{id}" → strip prefix
	const prefix = "/reference/notes/"
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	return strings.TrimPrefix(path, prefix)
}

// HandleGetNote returns a handler that gets a note by ID within the tenant scope.
func HandleGetNote(store *NoteStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := requireOrg(w, r)
		if !ok {
			return
		}

		nid := noteID(r.URL.Path)
		if nid == "" {
			http.Error(w, `{"error":"note ID required"}`, http.StatusBadRequest)
			return
		}

		store.mu.RLock()
		note, exists := store.notes[nid]
		store.mu.RUnlock()

		if !exists || note.OrganizationID != id {
			http.Error(w, `{"error":"note not found"}`, http.StatusNotFound)
			return
		}

		writeJSON(w, http.StatusOK, note)
	}
}

// HandleUpdateNote returns a handler that updates a note within the tenant scope.
func HandleUpdateNote(store *NoteStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := requireOrg(w, r)
		if !ok {
			return
		}

		nid := noteID(r.URL.Path)
		if nid == "" {
			http.Error(w, `{"error":"note ID required"}`, http.StatusBadRequest)
			return
		}

		var input struct {
			Title   string `json:"title"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
			return
		}

		store.mu.Lock()
		note, exists := store.notes[nid]
		if !exists || note.OrganizationID != id {
			store.mu.Unlock()
			http.Error(w, `{"error":"note not found"}`, http.StatusNotFound)
			return
		}

		note.Title = input.Title
		note.Content = input.Content
		note.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		store.mu.Unlock()

		writeJSON(w, http.StatusOK, note)
	}
}

// HandleDeleteNote returns a handler that deletes a note within the tenant scope.
func HandleDeleteNote(store *NoteStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := requireOrg(w, r)
		if !ok {
			return
		}

		nid := noteID(r.URL.Path)
		if nid == "" {
			http.Error(w, `{"error":"note ID required"}`, http.StatusBadRequest)
			return
		}

		store.mu.Lock()
		note, exists := store.notes[nid]
		if !exists || note.OrganizationID != id {
			store.mu.Unlock()
			http.Error(w, `{"error":"note not found"}`, http.StatusNotFound)
			return
		}

		delete(store.notes, nid)
		store.mu.Unlock()

		w.WriteHeader(http.StatusNoContent)
	}
}
