package domain

import (
	"testing"
)

func TestPermissionEvaluator_IsAdmin(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name string
		role string
		want bool
	}{
		{"admin role", "admin", true},
		{"admin_destino role", "admin_destino", false},
		{"gestor_destino role", "gestor_destino", false},
		{"consultor role", "consultor", false},
		{"auditor role", "auditor", false},
		{"gestor_regional role", "gestor_regional", false},
		{"gestor_nacional role", "gestor_nacional", false},
		{"empty role", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.IsAdmin(tt.role)
			if got != tt.want {
				t.Errorf("IsAdmin(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_HasEvaluationAccess(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name                  string
		role                  string
		userLevel             AccessLevel
		requiredLevel         AccessLevel
		want                  bool
	}{
		// Admin always has access regardless of level
		{"admin has administracion level", "admin", AccessLevelAdministracion, AccessLevelAdministracion, true},
		{"admin has solo_lectura level", "admin", AccessLevelSoloLectura, AccessLevelSoloLectura, true},
		{"admin access regardless of user level", "admin", AccessLevelSoloLectura, AccessLevelAdministracion, true},

		// Admin_destino with matching levels
		{"admin_destino has administracion level", "admin_destino", AccessLevelAdministracion, AccessLevelAdministracion, true},
		{"admin_destino has carga level", "admin_destino", AccessLevelCarga, AccessLevelCarga, true},
		{"admin_destino denied administracion with cargo level", "admin_destino", AccessLevelCarga, AccessLevelAdministracion, false},

		// Gestor_destino
		{"gestor_destino has carga level", "gestor_destino", AccessLevelCarga, AccessLevelCarga, true},
		{"gestor_destino denied evaluador level", "gestor_destino", AccessLevelCarga, AccessLevelEvaluador, false},

		// Consultor with evaluador level
		{"consultor has evaluador level", "consultor", AccessLevelEvaluador, AccessLevelEvaluador, true},
		{"consultor denied administracion level", "consultor", AccessLevelEvaluador, AccessLevelAdministracion, false},

		// Solo_lectura
		{"any role with solo_lectura can read", "gestor_destino", AccessLevelSoloLectura, AccessLevelSoloLectura, true},
		{"any role with solo_lectura denied carga", "gestor_destino", AccessLevelSoloLectura, AccessLevelCarga, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.HasEvaluationAccess(tt.role, tt.userLevel, tt.requiredLevel)
			if got != tt.want {
				t.Errorf("HasEvaluationAccess(%q, %q, %q) = %v, want %v",
					tt.role, tt.userLevel, tt.requiredLevel, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_CanWriteIndicator(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name             string
		role             string
		canWriteValues   bool
		evalStatus       EvaluationStatus
		isEditingEnabled bool
		want             bool
	}{
		// Admin always passes
		{"admin can write", "admin", false, EvaluationStatusEnCurso, true, true},
		{"admin can write even when editing disabled", "admin", false, EvaluationStatusEnCurso, false, true},

		// Normal user requires ALL conditions
		{"all conditions met", "gestor_destino", true, EvaluationStatusEnCurso, true, true},
		{"cannot write: no permission", "gestor_destino", false, EvaluationStatusEnCurso, true, false},
		{"cannot write: wrong status", "gestor_destino", true, EvaluationStatusCerrada, true, false},
		{"cannot write: editing disabled", "gestor_destino", true, EvaluationStatusEnCurso, false, false},
		{"cannot write: multiple failures", "consultor", false, EvaluationStatusCerrada, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.CanWriteIndicator(tt.role, tt.canWriteValues, tt.evalStatus, tt.isEditingEnabled)
			if got != tt.want {
				t.Errorf("CanWriteIndicator(%q, %v, %q, %v) = %v, want %v",
					tt.role, tt.canWriteValues, tt.evalStatus, tt.isEditingEnabled, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_BelongsToDestination(t *testing.T) {
	pe := NewPermissionEvaluator()
	destID := "e1a2b3c4-0000-0000-0000-000000000001"
	otherDestID := "e1a2b3c4-0000-0000-0000-000000000002"

	tests := []struct {
		name              string
		role              string
		userDestinationID *string
		destinationID     string
		want              bool
	}{
		// Admin always passes
		{"admin belongs to any destination", "admin", nil, destID, true},
		{"admin with nil destination", "admin", nil, destID, true},

		// Normal user: must match
		{"user belongs to own destination", "gestor_destino", &destID, destID, true},
		{"user does not belong to other destination", "gestor_destino", &destID, otherDestID, false},
		{"user with no destination cannot belong", "gestor_destino", nil, destID, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.BelongsToDestination(tt.role, tt.userDestinationID, tt.destinationID)
			if got != tt.want {
				t.Errorf("BelongsToDestination(%q, %v, %q) = %v, want %v",
					tt.role, tt.userDestinationID, tt.destinationID, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_IsAssignedEvaluator(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
	name      string
		role      string
		userLevel AccessLevel
		want      bool
	}{
		{"admin is always evaluator", "admin", AccessLevelSoloLectura, true},
		{"evaluador level passes", "consultor", AccessLevelEvaluador, true},
		{"administracion level passes", "admin_destino", AccessLevelAdministracion, true},
		{"carga level denied", "gestor_destino", AccessLevelCarga, false},
		{"solo_lectura denied", "auditor", AccessLevelSoloLectura, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.IsAssignedEvaluator(tt.role, tt.userLevel)
			if got != tt.want {
				t.Errorf("IsAssignedEvaluator(%q, %q) = %v, want %v",
					tt.role, tt.userLevel, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_CanManageUsers(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name      string
		role      string
		userLevel AccessLevel
		want      bool
	}{
		{"admin can manage users", "admin", AccessLevelSoloLectura, true},
		{"administracion level can manage", "admin_destino", AccessLevelAdministracion, true},
		{"evaluador level cannot manage", "consultor", AccessLevelEvaluador, false},
		{"carga level cannot manage", "gestor_destino", AccessLevelCarga, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.CanManageUsers(tt.role, tt.userLevel)
			if got != tt.want {
				t.Errorf("CanManageUsers(%q, %q) = %v, want %v",
					tt.role, tt.userLevel, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_CanChangeStatus(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name      string
		role      string
		userLevel AccessLevel
		want      bool
	}{
		{"admin can change status", "admin", AccessLevelSoloLectura, true},
		{"administracion can change status", "admin_destino", AccessLevelAdministracion, true},
		{"evaluador cannot change status", "consultor", AccessLevelEvaluador, false},
		{"carga cannot change status", "gestor_destino", AccessLevelCarga, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.CanChangeStatus(tt.role, tt.userLevel)
			if got != tt.want {
				t.Errorf("CanChangeStatus(%q, %q) = %v, want %v",
					tt.role, tt.userLevel, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_CanDesignateGoodPractice(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name string
		role string
		want bool
	}{
		{"consultor can designate", "consultor", true},
		{"auditor can designate", "auditor", true},
		{"admin cannot designate (different flow)", "admin", false},
		{"admin_destino cannot designate", "admin_destino", false},
		{"gestor_destino cannot designate", "gestor_destino", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.CanDesignateGoodPractice(tt.role)
			if got != tt.want {
				t.Errorf("CanDesignateGoodPractice(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_CanApproveGoodPractice(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name                     string
		role                     string
		canApproveGoodPractices  bool
		want                     bool
	}{
		{"admin can approve", "admin", false, true},
		{"admin_destino with permission", "admin_destino", true, true},
		{"admin_destino without permission", "admin_destino", false, false},
		{"gestor_destino with permission", "gestor_destino", true, true},
		{"consultor without permission", "consultor", false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.CanApproveGoodPractice(tt.role, tt.canApproveGoodPractices)
			if got != tt.want {
				t.Errorf("CanApproveGoodPractice(%q, %v) = %v, want %v",
					tt.role, tt.canApproveGoodPractices, got, tt.want)
			}
		})
	}
}

func TestPermissionEvaluator_CanPromote(t *testing.T) {
	pe := NewPermissionEvaluator()

	tests := []struct {
		name      string
		role      string
		userLevel AccessLevel
		want      bool
	}{
		{"admin can promote", "admin", AccessLevelSoloLectura, true},
		{"administracion can promote", "admin_destino", AccessLevelAdministracion, true},
		{"evaluador cannot promote", "consultor", AccessLevelEvaluador, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := pe.CanPromote(tt.role, tt.userLevel)
			if got != tt.want {
				t.Errorf("CanPromote(%q, %q) = %v, want %v", tt.role, tt.userLevel, got, tt.want)
			}
		})
	}
}
