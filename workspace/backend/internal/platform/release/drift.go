package release

// Drift represents a detected difference between expected and actual state.
type Drift struct {
	Path         string `json:"path"`
	ExpectedHash string `json:"expected_hash"`
	ActualHash   string `json:"actual_hash"`
	Status       string `json:"status"`
}

// DriftDetector is the interface for detecting drift between baseline
// and current state.
type DriftDetector interface {
	Detect(baseline map[string]string, current map[string]string) ([]Drift, error)
}

// HashDriftDetector compares SHA256 hashes of declared paths to detect drift.
type HashDriftDetector struct{}

// Detect compares baseline and current hashes and returns all drifts.
func (d *HashDriftDetector) Detect(baseline, current map[string]string) ([]Drift, error) {
	return DetectDrift(baseline, current)
}

// DetectDrift compares two hash maps and returns all paths where the hashes
// differ, paths that exist in one map but not the other.
func DetectDrift(baseline, current map[string]string) ([]Drift, error) {
	allPaths := map[string]struct{}{}
	for p := range baseline {
		allPaths[p] = struct{}{}
	}
	for p := range current {
		allPaths[p] = struct{}{}
	}

	var drifts []Drift
	for p := range allPaths {
		expected, inBaseline := baseline[p]
		actual, inCurrent := current[p]

		if inBaseline && inCurrent {
			if expected == actual {
				drifts = append(drifts, Drift{
					Path:         p,
					ExpectedHash: expected,
					ActualHash:   actual,
					Status:       "match",
				})
			} else {
				drifts = append(drifts, Drift{
					Path:         p,
					ExpectedHash: expected,
					ActualHash:   actual,
					Status:       "drift",
				})
			}
		} else if inBaseline && !inCurrent {
			drifts = append(drifts, Drift{
				Path:         p,
				ExpectedHash: expected,
				ActualHash:   "",
				Status:       "drift",
			})
		} else {
			// in current but not in baseline
			drifts = append(drifts, Drift{
				Path:         p,
				ExpectedHash: "",
				ActualHash:   actual,
				Status:       "drift",
			})
		}
	}

	return drifts, nil
}
