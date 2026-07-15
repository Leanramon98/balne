package domain

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestUser_DestinationID(t *testing.T) {
	// RED: Verify User can hold a nullable DestinationID
	destID := uuid.MustParse("a1b2c3d4-e5f6-7890-abcd-ef1234567890")

	t.Run("nil when not set", func(t *testing.T) {
		u := User{ID: uuid.New()}
		if u.DestinationID != nil {
			t.Error("expected DestinationID to be nil by default")
		}
	})

	t.Run("set and read", func(t *testing.T) {
		u := User{ID: uuid.New(), DestinationID: &destID}
		if u.DestinationID == nil {
			t.Fatal("expected DestinationID to be non-nil")
		}
		if *u.DestinationID != destID {
			t.Errorf("got %v, want %v", *u.DestinationID, destID)
		}
	})
}

func TestUser_FixedTypes(t *testing.T) {
	// RED: Verify broken types have been fixed to proper Go types
	now := time.Now().UTC().Truncate(time.Second)

	t.Run("IsActive is bool", func(t *testing.T) {
		u := User{IsActive: true}
		if !u.IsActive {
			t.Error("expected IsActive to be true")
		}
	})

	t.Run("CreatedAt and UpdatedAt are time.Time", func(t *testing.T) {
		u := User{CreatedAt: now, UpdatedAt: now}
		if !u.CreatedAt.Equal(now) {
			t.Errorf("CreatedAt: got %v, want %v", u.CreatedAt, now)
		}
		if !u.UpdatedAt.Equal(now) {
			t.Errorf("UpdatedAt: got %v, want %v", u.UpdatedAt, now)
		}
	})
}

func TestPermissionSet(t *testing.T) {
	// RED: Verify PermissionSet struct exists with all fields
	t.Run("default zero values", func(t *testing.T) {
		ps := PermissionSet{}
		if ps.AccessScope != "" {
			t.Errorf("AccessScope: got %q, want ''", ps.AccessScope)
		}
		if ps.CanWriteValues {
			t.Error("expected CanWriteValues to be false")
		}
		if ps.CanManageUsers {
			t.Error("expected CanManageUsers to be false")
		}
		if ps.CanApproveGoodPractices {
			t.Error("expected CanApproveGoodPractices to be false")
		}
		if ps.EvaluationTypes != nil {
			t.Error("expected EvaluationTypes to be nil")
		}
	})

	t.Run("JSON round-trip", func(t *testing.T) {
		original := PermissionSet{
			AccessScope:             "destination",
			CanWriteValues:          true,
			CanManageUsers:          true,
			CanApproveGoodPractices: false,
			EvaluationTypes:         []string{"autodiagnostico", "diagnostico"},
		}
		data, err := json.Marshal(original)
		if err != nil {
			t.Fatalf("marshal: %v", err)
		}

		var decoded PermissionSet
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		if decoded.AccessScope != original.AccessScope {
			t.Errorf("AccessScope: got %q, want %q", decoded.AccessScope, original.AccessScope)
		}
		if decoded.CanWriteValues != original.CanWriteValues {
			t.Errorf("CanWriteValues: got %v, want %v", decoded.CanWriteValues, original.CanWriteValues)
		}
		if len(decoded.EvaluationTypes) != 2 {
			t.Errorf("EvaluationTypes length: got %d, want 2", len(decoded.EvaluationTypes))
		}
	})
}

func TestRole_Permissions(t *testing.T) {
	// RED: Verify Role can hold permissions as json.RawMessage
	t.Run("is json.RawMessage", func(t *testing.T) {
		ps := PermissionSet{
			AccessScope:    "global",
			CanWriteValues: true,
			CanManageUsers: true,
		}
		data, _ := json.Marshal(ps)
		r := Role{Permissions: data}
		if r.Permissions == nil {
			t.Fatal("expected Permissions to be non-nil")
		}

		var decoded PermissionSet
		if err := json.Unmarshal(r.Permissions, &decoded); err != nil {
			t.Fatalf("unmarshal from Role: %v", err)
		}
		if decoded.AccessScope != "global" {
			t.Errorf("got %q, want 'global'", decoded.AccessScope)
		}
	})
}

func TestUserProfile_FixedTypes(t *testing.T) {
	// RED: Verify UserProfile has fixed types (text→string, json→json.RawMessage)
	t.Run("Bio is string", func(t *testing.T) {
		p := UserProfile{Bio: "hello"}
		if p.Bio != "hello" {
			t.Errorf("got %q, want 'hello'", p.Bio)
		}
	})

	t.Run("Preferences is json.RawMessage", func(t *testing.T) {
		data := json.RawMessage(`{"theme":"dark"}`)
		p := UserProfile{Preferences: data}
		if p.Preferences == nil {
			t.Fatal("expected Preferences to be non-nil")
		}
		var m map[string]string
		if err := json.Unmarshal(p.Preferences, &m); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if m["theme"] != "dark" {
			t.Errorf("got %q, want 'dark'", m["theme"])
		}
	})
}

func TestAuditLog_FixedTypes(t *testing.T) {
	// RED: Verify AuditLog has fixed types
	t.Run("OldValue and NewValue are json.RawMessage", func(t *testing.T) {
		oldV := json.RawMessage(`{"email":"old@test.com"}`)
		newV := json.RawMessage(`{"email":"new@test.com"}`)
		a := AuditLog{OldValue: oldV, NewValue: newV}
		if a.OldValue == nil || a.NewValue == nil {
			t.Fatal("expected OldValue and NewValue to be non-nil")
		}
	})

	t.Run("ChangedAt is time.Time", func(t *testing.T) {
		now := time.Now().UTC().Truncate(time.Second)
		a := AuditLog{ChangedAt: now}
		if !a.ChangedAt.Equal(now) {
			t.Errorf("got %v, want %v", a.ChangedAt, now)
		}
	})
}

func TestLoginResponse_Extended(t *testing.T) {
	// RED: Verify LoginResponse includes new fields
	userID := uuid.New()
	destID := uuid.MustParse("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
	perms := PermissionSet{AccessScope: "destination"}

	t.Run("has Role field", func(t *testing.T) {
		r := LoginResponse{Role: "admin_destino"}
		if r.Role != "admin_destino" {
			t.Errorf("got %q, want 'admin_destino'", r.Role)
		}
	})

	t.Run("has nullable DestinationID", func(t *testing.T) {
		r := LoginResponse{User: userID, DestinationID: &destID}
		if r.DestinationID == nil {
			t.Fatal("expected DestinationID to be non-nil")
		}
		if *r.DestinationID != destID {
			t.Errorf("got %v, want %v", *r.DestinationID, destID)
		}
	})

	t.Run("has Permissions", func(t *testing.T) {
		r := LoginResponse{Permissions: perms}
		if r.Permissions.AccessScope != "destination" {
			t.Errorf("got %q, want 'destination'", r.Permissions.AccessScope)
		}
	})
}
