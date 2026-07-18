package release

import (
	"testing"
	"time"
)

func TestParseRelease_ValidManifest(t *testing.T) {
	// Scenario 1: Release manifest parses
	data := []byte(`{
		"version": "1.0.0",
		"release_date": "2026-07-18T00:00:00Z",
		"compatibility": {
			"min_version": "0.9.0",
			"max_version": "2.0.0",
			"policy": "semver"
		},
		"upgrades": [
			{
				"from_version": "0.9.0",
				"to_version": "1.0.0",
				"migrations": ["migrate_v1"],
				"preconditions": [
					{"type": "min_version", "value": "0.9.0"}
				]
			}
		],
		"preconditions": [
			{"type": "capability", "value": "postgres"}
		],
		"checksums": {
			"file1.txt": "abc123"
		}
	}`)

	manifest, err := ParseRelease(data)
	if err != nil {
		t.Fatalf("ParseRelease() error = %v, want nil", err)
	}

	if manifest.Version != "1.0.0" {
		t.Fatalf("manifest.Version = %q, want %q", manifest.Version, "1.0.0")
	}
	if !manifest.ReleaseDate.Equal(time.Date(2026, 7, 18, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("manifest.ReleaseDate = %v, want 2026-07-18T00:00:00Z", manifest.ReleaseDate)
	}
	if manifest.Compatibility.MinVersion != "0.9.0" {
		t.Fatalf("manifest.Compatibility.MinVersion = %q, want %q", manifest.Compatibility.MinVersion, "0.9.0")
	}
	if len(manifest.Upgrades) != 1 {
		t.Fatalf("len(manifest.Upgrades) = %d, want 1", len(manifest.Upgrades))
	}
	if len(manifest.Preconditions) != 1 {
		t.Fatalf("len(manifest.Preconditions) = %d, want 1", len(manifest.Preconditions))
	}
	if manifest.Checksums["file1.txt"] != "abc123" {
		t.Fatalf("manifest.Checksums[\"file1.txt\"] = %q, want %q", manifest.Checksums["file1.txt"], "abc123")
	}

	// Verify UpgradeStep details
	step := manifest.Upgrades[0]
	if step.FromVersion != "0.9.0" {
		t.Fatalf("step.FromVersion = %q, want %q", step.FromVersion, "0.9.0")
	}
	if len(step.Migrations) != 1 || step.Migrations[0] != "migrate_v1" {
		t.Fatalf("step.Migrations = %v, want [\"migrate_v1\"]", step.Migrations)
	}

	// Verify Precondition details
	if manifest.Preconditions[0].Type != "capability" || manifest.Preconditions[0].Value != "postgres" {
		t.Fatalf("precondition = %+v, want {Type:capability Value:postgres}", manifest.Preconditions[0])
	}
}

func TestParseRelease_InvalidJSON(t *testing.T) {
	// Scenario 1: malformed JSON returns error
	_, err := ParseRelease([]byte(`{invalid`))
	if err == nil {
		t.Fatal("ParseRelease() error = nil, want error for invalid JSON")
	}
}

func TestParseRelease_EmptyData(t *testing.T) {
	_, err := ParseRelease([]byte{})
	if err == nil {
		t.Fatal("ParseRelease() error = nil, want error for empty data")
	}
}

func TestCheckUpgrade_ValidPath(t *testing.T) {
	// Scenario 2: Upgrade path validates
	manifest := ReleaseManifest{
		Version: "1.0.0",
		Upgrades: []UpgradeStep{
			{FromVersion: "0.9.0", ToVersion: "1.0.0"},
		},
	}

	err := CheckUpgrade("0.9.0", manifest)
	if err != nil {
		t.Fatalf("CheckUpgrade() error = %v, want nil", err)
	}
}

func TestCheckUpgrade_NoPath(t *testing.T) {
	// Scenario 2: No matching upgrade path
	manifest := ReleaseManifest{
		Version:  "1.0.0",
		Upgrades: []UpgradeStep{{FromVersion: "0.9.0", ToVersion: "1.0.0"}},
	}

	err := CheckUpgrade("0.8.0", manifest)
	if err == nil {
		t.Fatal("CheckUpgrade() error = nil, want error for unmapped version")
	}
}

func TestCheckUpgrade_AlreadyCurrent(t *testing.T) {
	err := CheckUpgrade("1.0.0", ReleaseManifest{Version: "1.0.0"})
	if err != nil {
		t.Fatalf("CheckUpgrade() error = %v, want nil when already current", err)
	}
}

func TestCheckCompatibility_Accepted(t *testing.T) {
	// Scenario 3: Compatible release accepted
	compat := Compatibility{MinVersion: "0.9.0", MaxVersion: "2.0.0", Policy: "semver"}
	err := CheckCompatibility("1.5.0", compat)
	if err != nil {
		t.Fatalf("CheckCompatibility() error = %v, want nil", err)
	}
}

func TestCheckCompatibility_RejectedBelow(t *testing.T) {
	// Scenario 4: Incompatible release rejected (below min)
	compat := Compatibility{MinVersion: "0.9.0", MaxVersion: "2.0.0", Policy: "semver"}
	err := CheckCompatibility("0.8.0", compat)
	if err == nil {
		t.Fatal("CheckCompatibility() error = nil, want error for version below min")
	}
}

func TestCheckCompatibility_RejectedAbove(t *testing.T) {
	// Scenario 4: Incompatible release rejected (above max)
	compat := Compatibility{MinVersion: "0.9.0", MaxVersion: "2.0.0", Policy: "semver"}
	err := CheckCompatibility("3.0.0", compat)
	if err == nil {
		t.Fatal("CheckCompatibility() error = nil, want error for version above max")
	}
}

func TestCheckCompatibility_ExactBoundaries(t *testing.T) {
	// Edge case: min and max boundaries are inclusive
	compat := Compatibility{MinVersion: "0.9.0", MaxVersion: "2.0.0", Policy: "semver"}
	if err := CheckCompatibility("0.9.0", compat); err != nil {
		t.Fatalf("CheckCompatibility() at min boundary error = %v, want nil", err)
	}
	if err := CheckCompatibility("2.0.0", compat); err != nil {
		t.Fatalf("CheckCompatibility() at max boundary error = %v, want nil", err)
	}
}

func TestCheckUpgrade_PreconditionsFail(t *testing.T) {
	// Scenario 6: Upgrade preconditions fail
	manifest := ReleaseManifest{
		Version: "2.0.0",
		Preconditions: []Precondition{
			{Type: "min_version", Value: "1.5.0"},
			{Type: "capability", Value: "storage"},
		},
	}

	err := CheckUpgrade("1.0.0", manifest)
	if err == nil {
		t.Fatal("CheckUpgrade() error = nil, want error for failing preconditions")
	}
}

func TestCheckUpgrade_PreconditionsPass(t *testing.T) {
	// Scenario 6: Upgrade preconditions pass
	manifest := ReleaseManifest{
		Version: "2.0.0",
		Upgrades: []UpgradeStep{
			{FromVersion: "1.0.0", ToVersion: "2.0.0"},
		},
		Preconditions: []Precondition{
			{Type: "min_version", Value: "0.9.0"},
			{Type: "capability", Value: "postgres"},
		},
	}

	err := CheckUpgrade("1.0.0", manifest)
	if err != nil {
		t.Fatalf("CheckUpgrade() error = %v, want nil when preconditions satisfied", err)
	}
}

func TestUpgradeStep_PreconditionsFail(t *testing.T) {
	// Scenario 6: Upgrade step-level preconditions fail
	manifest := ReleaseManifest{
		Version: "2.0.0",
		Upgrades: []UpgradeStep{
			{
				FromVersion: "1.0.0",
				ToVersion:   "2.0.0",
				Preconditions: []Precondition{
					{Type: "capability", Value: "object_storage"},
				},
			},
		},
	}

	err := CheckUpgrade("1.0.0", manifest)
	if err == nil {
		t.Fatal("CheckUpgrade() error = nil, want error for step-level precondition failure")
	}
}

func TestCheckCompatibility_EmptyPolicy(t *testing.T) {
	// Edge: empty policy should be accepted
	compat := Compatibility{MinVersion: "1.0.0", MaxVersion: "2.0.0"}
	err := CheckCompatibility("1.5.0", compat)
	if err != nil {
		t.Fatalf("CheckCompatibility() error = %v, want nil with empty policy", err)
	}
}

func TestParseRelease_UnknownFields(t *testing.T) {
	// Edge: unknown fields in JSON should be allowed (forward compat)
	data := []byte(`{
		"version": "1.0.0",
		"release_date": "2026-07-18T00:00:00Z",
		"compatibility": {"min_version": "0.9.0", "max_version": "2.0.0", "policy": "semver"},
		"upgrades": [],
		"preconditions": [],
		"checksums": {},
		"future_field": "should not break parsing"
	}`)

	_, err := ParseRelease(data)
	if err != nil {
		t.Fatalf("ParseRelease() error = %v, want nil (forward compat)", err)
	}
}

func TestCheckUpgrade_EmptyManifest(t *testing.T) {
	// Edge: empty upgrades list with no version match
	err := CheckUpgrade("1.0.0", ReleaseManifest{Version: "2.0.0"})
	if err == nil {
		t.Fatal("CheckUpgrade() error = nil, want error for empty upgrades list")
	}
}
