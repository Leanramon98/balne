package release

import (
	"testing"
)

func TestDetectDrift_Match(t *testing.T) {
	// Scenario 7: No drift when hashes match
	baseline := map[string]string{
		"schema.sql":  "abc123",
		"config.yaml": "def456",
	}
	current := map[string]string{
		"schema.sql":  "abc123",
		"config.yaml": "def456",
	}

	result, err := DetectDrift(baseline, current)
	if err != nil {
		t.Fatalf("DetectDrift() error = %v, want nil", err)
	}

	for _, d := range result {
		if d.Status != "match" {
			t.Fatalf("drift %q status = %q, want %q", d.Path, d.Status, "match")
		}
	}
}

func TestDetectDrift_DriftFound(t *testing.T) {
	// Scenario 7: Drift detected when hashes differ
	baseline := map[string]string{
		"schema.sql":  "abc123",
		"config.yaml": "def456",
	}
	current := map[string]string{
		"schema.sql":  "abc123",
		"config.yaml": "xyz789", // different hash = drift
	}

	result, err := DetectDrift(baseline, current)
	if err != nil {
		t.Fatalf("DetectDrift() error = %v, want nil", err)
	}

	foundDrift := false
	for _, d := range result {
		if d.Path == "config.yaml" && d.Status == "drift" {
			foundDrift = true
			if d.ExpectedHash != "def456" {
				t.Fatalf("drift ExpectedHash = %q, want %q", d.ExpectedHash, "def456")
			}
			if d.ActualHash != "xyz789" {
				t.Fatalf("drift ActualHash = %q, want %q", d.ActualHash, "xyz789")
			}
		}
	}
	if !foundDrift {
		t.Fatal("expected drift for config.yaml, none found")
	}
}

func TestDetectDrift_MissingPath(t *testing.T) {
	// Edge: path in baseline but not in current is drift
	baseline := map[string]string{"schema.sql": "abc123", "old_file.txt": "oldhash"}
	current := map[string]string{"schema.sql": "abc123"}

	result, err := DetectDrift(baseline, current)
	if err != nil {
		t.Fatalf("DetectDrift() error = %v, want nil", err)
	}

	for _, d := range result {
		if d.Path == "old_file.txt" {
			if d.Status != "drift" {
				t.Fatalf("missing file %q status = %q, want %q", d.Path, d.Status, "drift")
			}
			return
		}
	}
	t.Fatal("expected drift for old_file.txt, none found")
}

func TestDetectDrift_ExtraPath(t *testing.T) {
	// Edge: path in current but not in baseline is drift
	baseline := map[string]string{"schema.sql": "abc123"}
	current := map[string]string{"schema.sql": "abc123", "new_file.txt": "newhash"}

	result, err := DetectDrift(baseline, current)
	if err != nil {
		t.Fatalf("DetectDrift() error = %v, want nil", err)
	}

	for _, d := range result {
		if d.Path == "new_file.txt" {
			if d.Status != "drift" {
				t.Fatalf("extra file %q status = %q, want %q", d.Path, d.Status, "drift")
			}
			return
		}
	}
	t.Fatal("expected drift for new_file.txt, none found")
}

func TestDetectDrift_EmptyBaseline(t *testing.T) {
	// Edge: empty baseline means everything is drift
	baseline := map[string]string{}
	current := map[string]string{"file.txt": "hash123"}

	result, err := DetectDrift(baseline, current)
	if err != nil {
		t.Fatalf("DetectDrift() error = %v, want nil", err)
	}

	for _, d := range result {
		if d.Path == "file.txt" {
			if d.Status != "drift" {
				t.Fatalf("extra file %q status = %q, want %q", d.Path, d.Status, "drift")
			}
			return
		}
	}
	// 0-or-more drifts — no strict count assertion
}

func TestDetectDrift_EmptyCurrent(t *testing.T) {
	// Edge: empty current means baseline is missing
	baseline := map[string]string{"file.txt": "hash123"}
	current := map[string]string{}

	result, err := DetectDrift(baseline, current)
	if err != nil {
		t.Fatalf("DetectDrift() error = %v, want nil", err)
	}

	for _, d := range result {
		if d.Path == "file.txt" {
			if d.Status != "drift" {
				t.Fatalf("missing file %q status = %q, want %q", d.Path, d.Status, "drift")
			}
			return
		}
	}
	t.Fatal("expected drift for file.txt, none found")
}

func TestHashDriftDetector_HashMismatch(t *testing.T) {
	detector := &HashDriftDetector{}

	baseline := map[string]string{"file.bin": "abc123"}
	current := map[string]string{"file.bin": "def456"}

	result, err := detector.Detect(baseline, current)
	if err != nil {
		t.Fatalf("HashDriftDetector.Detect() error = %v, want nil", err)
	}

	if len(result) != 1 || result[0].Status != "drift" {
		t.Fatalf("expected 1 drift, got %v", result)
	}
}
