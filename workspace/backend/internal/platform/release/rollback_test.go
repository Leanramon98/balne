package release

import (
	"testing"
)

type memorySnapshotStore struct {
	snapshots map[string]Snapshot
}

func (m *memorySnapshotStore) Save(snapshot Snapshot) error {
	if m.snapshots == nil {
		m.snapshots = make(map[string]Snapshot)
	}
	m.snapshots[snapshot.ID] = snapshot
	return nil
}

func (m *memorySnapshotStore) Load(id string) (Snapshot, error) {
	s, ok := m.snapshots[id]
	if !ok {
		return Snapshot{}, ErrSnapshotNotFound
	}
	return s, nil
}

func (m *memorySnapshotStore) List() ([]Snapshot, error) {
	var result []Snapshot
	for _, s := range m.snapshots {
		result = append(result, s)
	}
	return result, nil
}

func TestCreateRollbackPlan(t *testing.T) {
	// Scenario 5: Rollback restores — plan creation
	snapshot := Snapshot{
		ID:      "snap-001",
		Version: "1.0.0",
		Data:    map[string]string{"schema_version": "1", "config_hash": "abc"},
	}

	plan := CreateRollbackPlan(snapshot, "0.9.0")
	if plan.SnapshotID != "snap-001" {
		t.Fatalf("plan.SnapshotID = %q, want %q", plan.SnapshotID, "snap-001")
	}
	if len(plan.Steps) == 0 {
		t.Fatal("plan.Steps is empty, expected at least one rollback step")
	}

	// First step should restore snapshot data
	first := plan.Steps[0]
	if first.Action != "restore_snapshot" {
		t.Fatalf("plan.Steps[0].Action = %q, want %q", first.Action, "restore_snapshot")
	}
	if first.Target != "snap-001" {
		t.Fatalf("plan.Steps[0].Target = %q, want %q", first.Target, "snap-001")
	}

	// There should be a revert migration step for the target version
	hasRevert := false
	for _, step := range plan.Steps {
		if step.Action == "revert_migration" {
			hasRevert = true
			break
		}
	}
	if !hasRevert {
		t.Fatal("expected at least one revert_migration step in rollback plan")
	}
}

func TestCreateRollbackPlan_EmptyData(t *testing.T) {
	// Edge: snapshot with no data still produces a valid plan
	snapshot := Snapshot{
		ID:      "snap-empty",
		Version: "1.0.0",
		Data:    map[string]string{},
	}
	plan := CreateRollbackPlan(snapshot, "0.9.0")
	if plan.SnapshotID != "snap-empty" {
		t.Fatalf("plan.SnapshotID = %q, want %q", plan.SnapshotID, "snap-empty")
	}
	if len(plan.Steps) == 0 {
		t.Fatal("plan.Steps is empty, expected rollback steps")
	}
}

func TestExecuteRollback_Success(t *testing.T) {
	// Scenario 5: Rollback restores — execution
	store := &memorySnapshotStore{}
	snapshot := Snapshot{
		ID:      "snap-002",
		Version: "1.0.0",
		Data:    map[string]string{"schema_version": "1", "config": "original"},
	}
	if err := store.Save(snapshot); err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	plan := CreateRollbackPlan(snapshot, "0.9.0")
	if err := ExecuteRollback(plan, store); err != nil {
		t.Fatalf("ExecuteRollback() error = %v, want nil", err)
	}
}

func TestExecuteRollback_SnapshotNotFound(t *testing.T) {
	// Scenario 5: Rollback with missing snapshot fails
	store := &memorySnapshotStore{}
	plan := RollbackPlan{
		SnapshotID: "nonexistent",
		Steps: []RollbackStep{
			{Action: "restore_snapshot", Target: "nonexistent"},
		},
	}

	err := ExecuteRollback(plan, store)
	if err == nil {
		t.Fatal("ExecuteRollback() error = nil, want error for missing snapshot")
	}
}

func TestSnapshotStore_SaveAndLoad(t *testing.T) {
	store := &memorySnapshotStore{}

	snapshot := Snapshot{
		ID:      "snap-003",
		Version: "2.0.0",
		Data:    map[string]string{"key": "value"},
	}

	if err := store.Save(snapshot); err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	loaded, err := store.Load("snap-003")
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if loaded.ID != "snap-003" || loaded.Version != "2.0.0" {
		t.Fatalf("loaded = %+v, want {ID:snap-003 Version:2.0.0}", loaded)
	}
}

func TestSnapshotStore_LoadNotFound(t *testing.T) {
	store := &memorySnapshotStore{}
	_, err := store.Load("nonexistent")
	if err == nil {
		t.Fatal("Load() error = nil, want error for missing snapshot")
	}
}

func TestSnapshotStore_List(t *testing.T) {
	store := &memorySnapshotStore{}
	store.Save(Snapshot{ID: "a", Version: "1.0.0"})
	store.Save(Snapshot{ID: "b", Version: "2.0.0"})

	snapshots, err := store.List()
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(snapshots) != 2 {
		t.Fatalf("len(snapshots) = %d, want 2", len(snapshots))
	}
}
