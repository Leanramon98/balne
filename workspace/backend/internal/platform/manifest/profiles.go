package manifest

import "project-base/backend/internal/platform/module"

// BuiltinProfiles returns the hardcoded deployment profiles.
// These are compiled into the binary — not loaded from config files — for safety.
func BuiltinProfiles() ProfileSet {
	return ProfileSet{
		// minimal: only mandatory capabilities, no default modules.
		// Suitable for a lean deployment with only core services.
		"minimal": {
			Capabilities: []module.Capability{"postgres"},
		},
		// full: includes all optional capabilities (storage, messaging) plus postgres.
		// Suitable for a feature-complete deployment.
		"full": {
			Capabilities: []module.Capability{"postgres", "storage", "messaging"},
		},
	}
}
