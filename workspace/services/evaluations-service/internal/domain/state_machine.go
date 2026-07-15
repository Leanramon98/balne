package domain

// ── State Machine ──────────────────────────────────────────────────────
// Pure business logic for evaluation state transitions.
// This is a stateless value object — no DB calls, no side effects.

// StateMachine defines valid transitions for evaluation statuses.
type StateMachine struct {
	transitions    map[EvaluationStatus][]EvaluationStatus
	transitionDesc map[[2]EvaluationStatus]string
}

// NewStateMachine creates a StateMachine with all allowed transitions.
func NewStateMachine() *StateMachine {
	sm := &StateMachine{
		transitions:    make(map[EvaluationStatus][]EvaluationStatus),
		transitionDesc: make(map[[2]EvaluationStatus]string),
	}

	// Forward cycle
	sm.add(EvaluationStatusBorrador, EvaluationStatusEnCurso, "iniciar")
	sm.add(EvaluationStatusEnCurso, EvaluationStatusCargaFinalizada, "finalizar_carga")
	sm.add(EvaluationStatusCargaFinalizada, EvaluationStatusEnEvaluacion, "iniciar_evaluacion")
	sm.add(EvaluationStatusEnEvaluacion, EvaluationStatusCerrada, "cerrar")

	// Anulación desde cualquier estado activo
	sm.add(EvaluationStatusBorrador, EvaluationStatusAnulada, "anular")
	sm.add(EvaluationStatusEnCurso, EvaluationStatusAnulada, "anular")
	sm.add(EvaluationStatusCargaFinalizada, EvaluationStatusAnulada, "anular")
	sm.add(EvaluationStatusEnEvaluacion, EvaluationStatusAnulada, "anular")

	// Reactivación
	sm.add(EvaluationStatusAnulada, EvaluationStatusBorrador, "reactivar")

	return sm
}

func (sm *StateMachine) add(from EvaluationStatus, to EvaluationStatus, desc string) {
	sm.transitions[from] = append(sm.transitions[from], to)
	sm.transitionDesc[[2]EvaluationStatus{from, to}] = desc
}

// CanTransition returns true if the transition from → to is allowed.
func (sm *StateMachine) CanTransition(from, to EvaluationStatus) bool {
	allowed, ok := sm.transitions[from]
	if !ok {
		return false
	}
	for _, a := range allowed {
		if a == to {
			return true
		}
	}
	return false
}

// AllowedTransitions returns all valid target states from the given state.
func (sm *StateMachine) AllowedTransitions(from EvaluationStatus) []EvaluationStatus {
	allowed, ok := sm.transitions[from]
	if !ok {
		return nil
	}
	result := make([]EvaluationStatus, len(allowed))
	copy(result, allowed)
	return result
}

// TransitionName returns a human-readable name for the transition.
func (sm *StateMachine) TransitionName(from, to EvaluationStatus) string {
	return sm.transitionDesc[[2]EvaluationStatus{from, to}]
}

// ── EvaluationType Progression ──────────────────────────────────────────
// Defines the evaluation cycle: Autodiagnóstico → Diagnóstico → Auditoría
// Medición Espontánea is standalone (no next type).

// NextEvaluationType returns the next type in the evaluation cycle.
// Returns ok=false if the type has no valid promotion target.
func NextEvaluationType(current EvaluationType) (EvaluationType, bool) {
	switch current {
	case EvaluationTypeAutodiagnostico:
		return EvaluationTypeDiagnostico, true
	case EvaluationTypeDiagnostico:
		return EvaluationTypeAuditoria, true
	default:
		return "", false
	}
}

// ── Scope Progress ──────────────────────────────────────────────────────

// ScopeProgress represents the progress of indicators within a scope.
type ScopeProgress struct {
	ScopeID             string  `json:"scope_id"`
	ScopeName           string  `json:"scope_name"`
	ScopeAcronym        string  `json:"scope_acronym"`
	ScopeIcon           string  `json:"scope_icon"`
	ScopeDescription    string  `json:"scope_description"`
	TotalIndicators     int     `json:"total_indicators"`
	CompletedIndicators int     `json:"completed_indicators"`
	CompletionPercent   float64 `json:"completion_percent"`
	Percentage          float64 `json:"percentage"`
	Status              string  `json:"status"` // "green", "orange", "empty"
}

// ── Transition Request / Response ───────────────────────────────────────

// ChangeStatusRequest is the payload for the change-status endpoint.
type ChangeStatusRequest struct {
	Status EvaluationStatus `json:"status"`
}

// ChangeStatusResponse includes allowed transitions on error.
type ChangeStatusResponse struct {
	AllowedTransitions []EvaluationStatus `json:"allowed_transitions,omitempty"`
	Message            string             `json:"message,omitempty"`
}
