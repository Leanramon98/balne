package domain

// ── PermissionEvaluator ────────────────────────────────────────────────
// Pure business logic for permission checking. No DB calls — receives data.
// Used by the HTTP adapter layer to authorize requests.

// Access levels ordered by hierarchy:
//
//	solo_lectura (0) < carga (1) < evaluador (2) < administracion (3)
var accessLevelOrder = map[AccessLevel]int{
	AccessLevelSoloLectura:    0,
	AccessLevelCarga:          1,
	AccessLevelEvaluador:      2,
	AccessLevelAdministracion: 3,
}

// PermissionEvaluator is a stateless value object that evaluates permissions.
type PermissionEvaluator struct{}

// NewPermissionEvaluator creates a new PermissionEvaluator.
func NewPermissionEvaluator() *PermissionEvaluator {
	return &PermissionEvaluator{}
}

// IsAdmin returns true if the role is "admin" (super admin).
func (pe *PermissionEvaluator) IsAdmin(role string) bool {
	return role == "admin"
}

// HasEvaluationAccess checks if a user has at least the required access level
// for a given evaluation. Admin always passes.
// evaluationAccessLevels is a map of evaluation_id → AccessLevel for the user.
func (pe *PermissionEvaluator) HasEvaluationAccess(
	role string,
	evaluationAccessLevel AccessLevel,
	requiredLevel AccessLevel,
) bool {
	if pe.IsAdmin(role) {
		return true
	}
	return accessLevelOrder[evaluationAccessLevel] >= accessLevelOrder[requiredLevel]
}

// CanWriteIndicator checks if the user can write an indicator value.
// Requires: CanWriteValues permission + evaluation is "en_curso" + editing enabled.
func (pe *PermissionEvaluator) CanWriteIndicator(
	role string,
	canWriteValues bool,
	evaluationStatus EvaluationStatus,
	isEditingEnabled bool,
) bool {
	if pe.IsAdmin(role) {
		return true
	}
	return canWriteValues &&
		evaluationStatus == EvaluationStatusEnCurso &&
		isEditingEnabled
}

// BelongsToDestination checks if the user belongs to the given destination.
// Admin always passes.
func (pe *PermissionEvaluator) BelongsToDestination(
	role string,
	userDestinationID *string,
	destinationID string,
) bool {
	if pe.IsAdmin(role) {
		return true
	}
	if userDestinationID == nil {
		return false
	}
	return *userDestinationID == destinationID
}

// IsAssignedEvaluator checks if the user has at least "evaluador" level access.
func (pe *PermissionEvaluator) IsAssignedEvaluator(
	role string,
	evaluationAccessLevel AccessLevel,
) bool {
	return pe.HasEvaluationAccess(role, evaluationAccessLevel, AccessLevelEvaluador)
}

// CanManageUsers checks if the user has administracion-level access.
func (pe *PermissionEvaluator) CanManageUsers(
	role string,
	evaluationAccessLevel AccessLevel,
) bool {
	return pe.HasEvaluationAccess(role, evaluationAccessLevel, AccessLevelAdministracion)
}

// CanChangeStatus checks if the user can change evaluation status.
// Only administracion-level users can change status.
func (pe *PermissionEvaluator) CanChangeStatus(
	role string,
	evaluationAccessLevel AccessLevel,
) bool {
	return pe.HasEvaluationAccess(role, evaluationAccessLevel, AccessLevelAdministracion)
}

// CanPromote checks if the user can promote an evaluation.
func (pe *PermissionEvaluator) CanPromote(
	role string,
	evaluationAccessLevel AccessLevel,
) bool {
	return pe.HasEvaluationAccess(role, evaluationAccessLevel, AccessLevelAdministracion)
}

// CanManageEvaluationAccess checks if the user can grant/revoke evaluation access.
func (pe *PermissionEvaluator) CanManageEvaluationAccess(
	role string,
	evaluationAccessLevel AccessLevel,
) bool {
	return pe.HasEvaluationAccess(role, evaluationAccessLevel, AccessLevelAdministracion)
}

// CanDesignateGoodPractice checks if user (consultor/auditor) can designate a GP.
func (pe *PermissionEvaluator) CanDesignateGoodPractice(role string) bool {
	return role == "consultor" || role == "auditor"
}

// CanApproveGoodPractice checks if user has can_approve_good_practices permission.
func (pe *PermissionEvaluator) CanApproveGoodPractice(
	role string,
	canApproveGoodPractices bool,
) bool {
	if pe.IsAdmin(role) {
		return true
	}
	return canApproveGoodPractices
}
