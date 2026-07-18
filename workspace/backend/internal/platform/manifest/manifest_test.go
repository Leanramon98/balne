package manifest

import (
	"strings"
	"testing"

	"project-base/backend/internal/platform/module"
)

type stub struct{ descriptor module.Descriptor }

func (s stub) Descriptor() module.Descriptor { return s.descriptor }

func registry(t *testing.T) *module.Registry {
	t.Helper()
	d := module.Descriptor{ID: "notes", RequiredCapabilities: []module.Capability{"postgres"}}
	r, err := module.NewRegistry([]module.Module{stub{d}}, []module.Capability{"postgres", "storage"})
	if err != nil {
		t.Fatal(err)
	}
	return r
}

func multiRegistry(t *testing.T) *module.Registry {
	t.Helper()
	notes := stub{module.Descriptor{ID: "notes", RequiredCapabilities: []module.Capability{"postgres"}}}
	reports := stub{module.Descriptor{ID: "reports", RequiredCapabilities: []module.Capability{"postgres", "storage"}}}
	r, err := module.NewRegistry([]module.Module{notes, reports}, []module.Capability{"postgres", "storage", "messaging"})
	if err != nil {
		t.Fatal(err)
	}
	return r
}

func TestValidate_ValidStructuralComposition(t *testing.T) {
	composition, err := Validate(Manifest{Modules: []string{"notes"}, Capabilities: []module.Capability{"postgres"}}, registry(t))
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if len(composition.Modules) != 1 || composition.Modules[0].ID != "notes" {
		t.Fatalf("composition modules = %v", composition.Modules)
	}
	var _ RuntimeEntitlements = map[string]bool{"notes": false}
}

func TestValidate_RejectsInvalidSelections(t *testing.T) {
	tests := []struct {
		name  string
		value Manifest
		want  string
	}{
		{"unknown module", Manifest{Modules: []string{"missing"}}, "unknown module"},
		{"duplicate module", Manifest{Modules: []string{"notes", "notes"}}, "duplicate module selection"},
		{"unknown capability", Manifest{Capabilities: []module.Capability{"missing"}}, "unknown capability"},
		{"duplicate capability", Manifest{Capabilities: []module.Capability{"postgres", "postgres"}}, "duplicate capability selection"},
		{"missing required capability", Manifest{Modules: []string{"notes"}}, "missing required capability"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Validate(tt.value, registry(t))
			if err == nil || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("Validate() error = %v, want %q", err, tt.want)
			}
		})
	}
}

func TestDecode_RejectsUnknownOrTrailingContent(t *testing.T) {
	tests := []struct{ name, input, want string }{
		{"unknown field", `{"modules":[],"capabilities":[],"extra":true}`, "unknown field"},
		{"trailing JSON", `{"modules":[]} {}`, "trailing content"},
		{"trailing text", `{"modules":[]} garbage`, "trailing content"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decode(strings.NewReader(tt.input))
			if err == nil || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("Decode() error = %v, want %q", err, tt.want)
			}
		})
	}
}

// --- Profile / Adapter tests (RED: types don't exist yet) ---

func TestResolveProfile_UnknownProfile(t *testing.T) {
	_, err := ResolveProfile(Manifest{Profile: "nonexistent"}, BuiltinProfiles())
	if err == nil || !strings.Contains(err.Error(), "unknown profile") {
		t.Fatalf("ResolveProfile() error = %v, want unknown profile error", err)
	}
}

func TestResolveProfile_EmptyProfileNoOp(t *testing.T) {
	manifest := Manifest{Modules: []string{"notes"}, Capabilities: []module.Capability{"postgres"}}
	resolved, err := ResolveProfile(manifest, BuiltinProfiles())
	if err != nil {
		t.Fatalf("ResolveProfile() error = %v", err)
	}
	if len(resolved.Modules) != 1 || resolved.Modules[0] != "notes" {
		t.Fatalf("resolved.Modules = %v, want [notes]", resolved.Modules)
	}
	if len(resolved.Capabilities) != 1 || resolved.Capabilities[0] != "postgres" {
		t.Fatalf("resolved.Capabilities = %v, want [postgres]", resolved.Capabilities)
	}
}

func TestResolveProfile_MinimalProfile(t *testing.T) {
	profiles := BuiltinProfiles()
	p, ok := profiles["minimal"]
	if !ok {
		t.Fatal("builtin profiles missing minimal")
	}
	if len(p.Modules) != 0 {
		t.Fatalf("minimal profile Modules = %v, want []", p.Modules)
	}
	if len(p.Capabilities) != 1 || p.Capabilities[0] != "postgres" {
		t.Fatalf("minimal profile Capabilities = %v, want [postgres]", p.Capabilities)
	}
}

func TestResolveProfile_FullProfile(t *testing.T) {
	profiles := BuiltinProfiles()
	p, ok := profiles["full"]
	if !ok {
		t.Fatal("builtin profiles missing full")
	}
	if len(p.Capabilities) != 3 {
		t.Fatalf("full profile Capabilities = %v, want [postgres storage messaging]", p.Capabilities)
	}
}

func TestResolveProfile_ExplicitOverridesProfile(t *testing.T) {
	// Profile with explicit modules: manifest modules REPLACE profile modules.
	// Minimal has no default modules, so ["notes"] replaces [] → modules=[notes].
	manifest := Manifest{Profile: "minimal", Modules: []string{"notes"}}
	resolved, err := ResolveProfile(manifest, BuiltinProfiles())
	if err != nil {
		t.Fatalf("ResolveProfile() error = %v", err)
	}
	if len(resolved.Modules) != 1 || resolved.Modules[0] != "notes" {
		t.Fatalf("resolved.Modules = %v, want [notes]", resolved.Modules)
	}
	if len(resolved.Capabilities) != 1 || resolved.Capabilities[0] != "postgres" {
		t.Fatalf("resolved.Capabilities = %v, want [postgres]", resolved.Capabilities)
	}
}

func TestResolveProfile_ExplicitCapabilitiesOverrideProfile(t *testing.T) {
	manifest := Manifest{Profile: "minimal", Capabilities: []module.Capability{"storage"}}
	resolved, err := ResolveProfile(manifest, BuiltinProfiles())
	if err != nil {
		t.Fatalf("ResolveProfile() error = %v", err)
	}
	if len(resolved.Capabilities) != 1 || resolved.Capabilities[0] != "storage" {
		t.Fatalf("resolved.Capabilities = %v, want [storage]", resolved.Capabilities)
	}
	// Modules should come from profile (minimal has none)
	if len(resolved.Modules) != 0 {
		t.Fatalf("resolved.Modules = %v, want []", resolved.Modules)
	}
}

func TestValidate_WithMinimalProfile_Valid(t *testing.T) {
	// Minimal profile (postgres capability) + notes module (requires postgres) → valid
	composition, err := Validate(Manifest{Profile: "minimal", Modules: []string{"notes"}}, multiRegistry(t))
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if len(composition.Modules) != 1 || composition.Modules[0].ID != "notes" {
		t.Fatalf("composition modules = %v", composition.Modules)
	}
	if len(composition.Capabilities) != 1 || composition.Capabilities[0] != "postgres" {
		t.Fatalf("composition capabilities = %v", composition.Capabilities)
	}
}

func TestValidate_WithFullProfile_Valid(t *testing.T) {
	// Full profile (postgres, storage, messaging) + notes + reports → valid
	composition, err := Validate(Manifest{Profile: "full", Modules: []string{"notes", "reports"}}, multiRegistry(t))
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if len(composition.Modules) != 2 {
		t.Fatalf("composition modules = %v, want 2", composition.Modules)
	}
	if len(composition.Capabilities) != 3 {
		t.Fatalf("composition capabilities = %v, want 3", composition.Capabilities)
	}
}

func TestValidate_WithMinimalProfile_MissingOptionalCapability(t *testing.T) {
	// reports requires storage, but minimal profile only has postgres
	_, err := Validate(Manifest{Profile: "minimal", Modules: []string{"reports"}}, multiRegistry(t))
	if err == nil || !strings.Contains(err.Error(), "missing required capability") {
		t.Fatalf("Validate() error = %v, want missing required capability error", err)
	}
}

func TestValidate_WithUnknownProfile_Rejected(t *testing.T) {
	_, err := Validate(Manifest{Profile: "bogus", Modules: []string{"notes"}}, multiRegistry(t))
	if err == nil || !strings.Contains(err.Error(), "unknown profile") {
		t.Fatalf("Validate() error = %v, want unknown profile error", err)
	}
}

func TestValidate_ProfileOverriddenByExplicit(t *testing.T) {
	// Profile minimal (postgres) but explicit capabilities override to add storage
	composition, err := Validate(Manifest{Profile: "minimal", Modules: []string{"notes", "reports"}, Capabilities: []module.Capability{"postgres", "storage"}}, multiRegistry(t))
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if len(composition.Modules) != 2 {
		t.Fatalf("composition modules = %v, want 2", composition.Modules)
	}
	// capabilities should be what we explicitly set (postgres + storage), not just postgres
	if len(composition.Capabilities) != 2 {
		t.Fatalf("composition capabilities = %v, want [postgres storage]", composition.Capabilities)
	}
}

func TestValidate_EmptyProfileIsValid(t *testing.T) {
	// No profile, no modules, no capabilities → empty composition is valid
	composition, err := Validate(Manifest{}, multiRegistry(t))
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if len(composition.Modules) != 0 {
		t.Fatalf("composition modules = %v, want []", composition.Modules)
	}
	if len(composition.Capabilities) != 0 {
		t.Fatalf("composition capabilities = %v, want []", composition.Capabilities)
	}
}

func TestValidate_BackwardCompatible(t *testing.T) {
	// Existing-style manifest without profile field still works
	composition, err := Validate(Manifest{Modules: []string{"notes"}, Capabilities: []module.Capability{"postgres"}}, registry(t))
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if len(composition.Modules) != 1 || composition.Modules[0].ID != "notes" {
		t.Fatalf("composition modules = %v", composition.Modules)
	}
}
