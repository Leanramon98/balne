// Package compat provides legacy compatibility adapters for route and data
// mapping during the neutral migration. It allows DTI legacy code to coexist
// with the new neutral backend without requiring a coordinated cutover.
//
// Pure Go, no external dependencies, no DTI runtime dependency.
package compat

import (
	"fmt"
	"sort"
)

// RouteAdapter maps a legacy route path to its neutral handler path.
type RouteAdapter interface {
	// LegacyPath returns the old route path this adapter handles.
	// This is the path the legacy client continues to call.
	LegacyPath() string

	// NewPath returns the new handler path to route to.
	// This is the path registered in the neutral backend.
	NewPath() string
}

// DataAdapter maps a legacy data model to and from its neutral counterpart.
type DataAdapter interface {
	// SourceType returns the legacy data type identifier this adapter handles.
	SourceType() string

	// Adapt converts legacy data to the neutral model format.
	// It MUST handle nil/empty legacy input without panicking.
	Adapt(legacy map[string]any) (map[string]any, error)

	// Revert converts neutral model data back to the legacy format.
	// It MUST handle nil/empty neutral input without panicking.
	Revert(neutral map[string]any) (map[string]any, error)
}

// Registry holds registered route and data adapters. It provides
// lookup, composition, and safe removal of adapters.
type Registry struct {
	routes map[string]RouteAdapter
	data   map[string]DataAdapter
}

// NewRegistry creates an empty adapter registry.
func NewRegistry() *Registry {
	return &Registry{
		routes: make(map[string]RouteAdapter),
		data:   make(map[string]DataAdapter),
	}
}

// RegisterRoute registers a route adapter. It returns an error if a route
// adapter for the same LegacyPath is already registered.
func (r *Registry) RegisterRoute(adapter RouteAdapter) error {
	path := adapter.LegacyPath()
	if _, exists := r.routes[path]; exists {
		return fmt.Errorf("route adapter already registered for %q", path)
	}
	r.routes[path] = adapter
	return nil
}

// RegisterData registers a data adapter. It returns an error if a data
// adapter for the same SourceType is already registered.
func (r *Registry) RegisterData(adapter DataAdapter) error {
	source := adapter.SourceType()
	if _, exists := r.data[source]; exists {
		return fmt.Errorf("data adapter already registered for %q", source)
	}
	r.data[source] = adapter
	return nil
}

// ResolveRoute looks up a legacy route path and returns the neutral handler
// path. It returns ("", false) for unknown routes — never an error — to keep
// the caller's fallback to 404 clean.
func (r *Registry) ResolveRoute(legacyPath string) (string, bool) {
	adapter, ok := r.routes[legacyPath]
	if !ok {
		return "", false
	}
	return adapter.NewPath(), true
}

// AdaptData converts legacy data to the neutral model using the registered
// adapter for the given source type. It returns an error if no adapter is
// registered for the source type.
func (r *Registry) AdaptData(sourceType string, legacy map[string]any) (map[string]any, error) {
	adapter, ok := r.data[sourceType]
	if !ok {
		return nil, fmt.Errorf("no data adapter registered for %q", sourceType)
	}
	return adapter.Adapt(legacy)
}

// RevertData converts neutral model data back to the legacy format using
// the registered adapter for the given source type. It returns an error
// if no adapter is registered for the source type.
func (r *Registry) RevertData(sourceType string, neutral map[string]any) (map[string]any, error) {
	adapter, ok := r.data[sourceType]
	if !ok {
		return nil, fmt.Errorf("no data adapter registered for %q", sourceType)
	}
	return adapter.Revert(neutral)
}

// RemoveRoute removes a route adapter by its legacy path. Removing an
// unregistered path is a no-op — callers can safely remove adapters
// without checking existence first.
func (r *Registry) RemoveRoute(legacyPath string) {
	delete(r.routes, legacyPath)
}

// RemoveData removes a data adapter by its source type. Removing an
// unregistered type is a no-op.
func (r *Registry) RemoveData(sourceType string) {
	delete(r.data, sourceType)
}

// RouteIDs returns the sorted list of registered legacy route paths.
func (r *Registry) RouteIDs() []string {
	ids := make([]string, 0, len(r.routes))
	for id := range r.routes {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// DataIDs returns the sorted list of registered data source types.
func (r *Registry) DataIDs() []string {
	ids := make([]string, 0, len(r.data))
	for id := range r.data {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}
