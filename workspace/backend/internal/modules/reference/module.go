// Package reference provides a neutral reference module proving registration,
// tenant data, permissions, health, and clean removal within neutral scope.
package reference

import (
	"project-base/backend/internal/platform/module"
)

// ReferenceModule implements the module.Module interface for the reference module.
type ReferenceModule struct{}

// Descriptor returns the module descriptor with routes, permissions, migrations,
// health, and required capabilities.
func (m *ReferenceModule) Descriptor() module.Descriptor {
	return module.Descriptor{
		ID: "reference",
		Routes: []module.Route{
			{Method: "GET", Path: "/reference/notes"},
			{Method: "POST", Path: "/reference/notes"},
			{Method: "GET", Path: "/reference/notes/:id"},
			{Method: "PUT", Path: "/reference/notes/:id"},
			{Method: "DELETE", Path: "/reference/notes/:id"},
			{Method: "GET", Path: "/reference/health"},
		},
		Permissions: []string{"reference.read", "reference.write", "reference.admin"},
		Migrations: []module.Migration{
			{ID: "reference-001", Order: 1},
		},
		Health:               "reference.ok",
		RequiredCapabilities: []module.Capability{"postgres"},
	}
}
