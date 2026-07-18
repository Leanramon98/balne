// Package manifest validates structural deployment composition before readiness.
package manifest

import (
	"encoding/json"
	"fmt"
	"io"

	"project-base/backend/internal/platform/module"
)

type Manifest struct {
	Profile      string              `json:"profile,omitempty"`
	Modules      []string            `json:"modules"`
	Capabilities []module.Capability `json:"capabilities"`
}

// Profile is a named deployment composition template.
type Profile struct {
	Modules      []string            `json:"modules,omitempty"`
	Capabilities []module.Capability `json:"capabilities,omitempty"`
}

// ProfileSet is a collection of named profiles.
type ProfileSet map[string]Profile

// RuntimeEntitlements are evaluated after startup and cannot load absent modules.
type RuntimeEntitlements map[string]bool

type Composition struct {
	Modules      []module.Descriptor
	Capabilities []module.Capability
}

// ResolveProfile merges a manifest's profile template with its explicit fields.
//
// Resolution order:
//  1. If Profile is empty, return manifest unchanged (backward-compatible).
//  2. If Profile is set but unknown, return error.
//  3. Start with the profile's default modules and capabilities.
//  4. If manifest.Modules is non-nil, it REPLACES the profile's modules.
//  5. If manifest.Capabilities is non-nil, it REPLACES the profile's capabilities.
func ResolveProfile(manifest Manifest, profiles ProfileSet) (Manifest, error) {
	if manifest.Profile == "" {
		return manifest, nil
	}
	profile, ok := profiles[manifest.Profile]
	if !ok {
		return Manifest{}, fmt.Errorf("unknown profile %q", manifest.Profile)
	}
	result := Manifest{
		Modules:      profile.Modules,
		Capabilities: profile.Capabilities,
	}
	if manifest.Modules != nil {
		result.Modules = manifest.Modules
	}
	if manifest.Capabilities != nil {
		result.Capabilities = manifest.Capabilities
	}
	return result, nil
}

func Decode(reader io.Reader) (Manifest, error) {
	decoder := json.NewDecoder(reader)
	decoder.DisallowUnknownFields()
	var value Manifest
	if err := decoder.Decode(&value); err != nil {
		return value, fmt.Errorf("decode manifest: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return value, fmt.Errorf("trailing content after manifest: %v", err)
	}
	return value, nil
}

func Validate(value Manifest, registry *module.Registry) (Composition, error) {
	resolved, err := ResolveProfile(value, BuiltinProfiles())
	if err != nil {
		return Composition{}, err
	}
	selectedModules := map[string]struct{}{}
	selectedCapabilities := map[module.Capability]struct{}{}
	composition := Composition{Capabilities: append([]module.Capability(nil), resolved.Capabilities...)}
	for _, id := range resolved.Modules {
		if _, exists := selectedModules[id]; exists {
			return Composition{}, fmt.Errorf("duplicate module selection %q", id)
		}
		if !registry.Has(id) {
			return Composition{}, fmt.Errorf("unknown module %q", id)
		}
		selectedModules[id] = struct{}{}
	}
	for _, capability := range resolved.Capabilities {
		if _, exists := selectedCapabilities[capability]; exists {
			return Composition{}, fmt.Errorf("duplicate capability selection %q", capability)
		}
		if !registry.HasCapability(capability) {
			return Composition{}, fmt.Errorf("unknown capability %q", capability)
		}
		selectedCapabilities[capability] = struct{}{}
	}
	for _, id := range resolved.Modules {
		descriptor, _ := registry.Get(id)
		for _, required := range descriptor.RequiredCapabilities {
			if _, enabled := selectedCapabilities[required]; !enabled {
				return Composition{}, fmt.Errorf("module %q missing required capability %q", id, required)
			}
		}
		composition.Modules = append(composition.Modules, descriptor)
	}
	return composition, nil
}
