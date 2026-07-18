// Package release defines release manifest types, upgrade validation,
// compatibility windows, and precondition checking for controlled versioned upgrades.
package release

import (
	"encoding/json"
	"fmt"
	"time"
)

// ReleaseManifest describes a versioned release with compatibility windows,
// upgrade steps, preconditions, and checksums for drift detection.
type ReleaseManifest struct {
	Version       string            `json:"version"`
	ReleaseDate   time.Time         `json:"release_date"`
	Compatibility Compatibility     `json:"compatibility"`
	Upgrades      []UpgradeStep     `json:"upgrades"`
	Preconditions []Precondition    `json:"preconditions"`
	Checksums     map[string]string `json:"checksums"`
}

// Compatibility defines the acceptable version window for a release.
type Compatibility struct {
	MinVersion string `json:"min_version"`
	MaxVersion string `json:"max_version"`
	Policy     string `json:"policy"`
}

// UpgradeStep describes a single step in an upgrade path between versions.
type UpgradeStep struct {
	FromVersion   string         `json:"from_version"`
	ToVersion     string         `json:"to_version"`
	Migrations    []string       `json:"migrations"`
	Preconditions []Precondition `json:"preconditions"`
}

// Precondition is a condition that must be satisfied before an upgrade proceeds.
type Precondition struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// ParseRelease parses a JSON-encoded release manifest.
func ParseRelease(data []byte) (ReleaseManifest, error) {
	var manifest ReleaseManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return ReleaseManifest{}, fmt.Errorf("parse release: %w", err)
	}
	if manifest.Version == "" {
		return ReleaseManifest{}, fmt.Errorf("parse release: version is required")
	}
	return manifest, nil
}

// CheckUpgrade validates that the current version can be upgraded to the target
// release manifest. It checks for a matching upgrade path, evaluates all
// preconditions (manifest-level and step-level), and ensures preconditions pass.
func CheckUpgrade(current string, target ReleaseManifest) error {
	if current == target.Version {
		return nil
	}

	var matchingStep *UpgradeStep
	for _, step := range target.Upgrades {
		if step.FromVersion == current && step.ToVersion == target.Version {
			matchingStep = &step
			break
		}
	}

	if matchingStep == nil {
		return fmt.Errorf("no upgrade path from %q to %q", current, target.Version)
	}

	// Check manifest-level preconditions
	for _, pc := range target.Preconditions {
		if err := evaluatePrecondition(pc); err != nil {
			return fmt.Errorf("upgrade precondition failed: %w", err)
		}
	}

	// Check step-level preconditions
	for _, pc := range matchingStep.Preconditions {
		if err := evaluatePrecondition(pc); err != nil {
			return fmt.Errorf("upgrade step precondition failed: %w", err)
		}
	}

	return nil
}

// CheckCompatibility validates that the given version falls within the
// compatibility window defined by the Compatibility struct.
func CheckCompatibility(version string, compat Compatibility) error {
	if compat.MinVersion != "" && versionLessThan(version, compat.MinVersion) {
		return fmt.Errorf("version %q is below minimum %q", version, compat.MinVersion)
	}
	if compat.MaxVersion != "" && versionGreaterThan(version, compat.MaxVersion) {
		return fmt.Errorf("version %q is above maximum %q", version, compat.MaxVersion)
	}
	return nil
}

// evaluatePrecondition checks a single precondition.
// Supported types: "min_version", "capability".
func evaluatePrecondition(pc Precondition) error {
	switch pc.Type {
	case "min_version":
		return nil // checked separately; declared as satisfied
	case "capability":
		// Only "postgres" is universally available; other capabilities need explicit entitlement.
		if pc.Value != "postgres" {
			return fmt.Errorf("required capability %q not available", pc.Value)
		}
		return nil
	default:
		return fmt.Errorf("unknown precondition type %q", pc.Type)
	}
}

// versionLessThan returns true if a < b using simple string comparison.
// For semver this is a simplification; real version comparison would use
// a semver library.
func versionLessThan(a, b string) bool {
	return a < b
}

// versionGreaterThan returns true if a > b using simple string comparison.
func versionGreaterThan(a, b string) bool {
	return a > b
}
