package release

import (
	"errors"
	"fmt"
	"time"
)

// ErrSnapshotNotFound is returned when a snapshot cannot be found in the store.
var ErrSnapshotNotFound = errors.New("snapshot not found")

// Snapshot captures the state before an upgrade for rollback purposes.
type Snapshot struct {
	ID        string            `json:"id"`
	Version   string            `json:"version"`
	Timestamp time.Time         `json:"timestamp"`
	Data      map[string]string `json:"data"`
}

// RollbackPlan describes the steps needed to roll back an upgrade.
type RollbackPlan struct {
	Steps      []RollbackStep `json:"steps"`
	SnapshotID string         `json:"snapshot_id"`
}

// RollbackStep is a single action within a rollback plan.
type RollbackStep struct {
	Action string `json:"action"`
	Target string `json:"target"`
}

// SnapshotStore is the persistence interface for upgrade snapshots.
type SnapshotStore interface {
	Save(snapshot Snapshot) error
	Load(id string) (Snapshot, error)
	List() ([]Snapshot, error)
}

// CreateRollbackPlan constructs a rollback plan from a snapshot and target version.
// The plan includes restore steps for the snapshot data and revert steps for
// migrations that need to be undone.
func CreateRollbackPlan(snapshot Snapshot, targetVersion string) RollbackPlan {
	steps := []RollbackStep{
		{Action: "restore_snapshot", Target: snapshot.ID},
		{Action: "revert_migration", Target: targetVersion},
	}
	return RollbackPlan{
		Steps:      steps,
		SnapshotID: snapshot.ID,
	}
}

// ExecuteRollback runs the rollback plan against the provided SnapshotStore.
// It restores the snapshot data first, then executes each rollback step.
func ExecuteRollback(plan RollbackPlan, store SnapshotStore) error {
	for _, step := range plan.Steps {
		switch step.Action {
		case "restore_snapshot":
			snapshot, err := store.Load(step.Target)
			if err != nil {
				return fmt.Errorf("rollback restore failed: %w", err)
			}
			// In a real implementation, this would restore the Data to the system.
			// For the pure domain model, we verify the snapshot is loadable.
			_ = snapshot
		case "revert_migration":
			// Placeholder: real implementation would execute the revert SQL.
			// For domain validation, the step is recorded and acknowledged.
		default:
			return fmt.Errorf("unknown rollback action %q", step.Action)
		}
	}
	return nil
}
