package domain

import (
	"encoding/json"
	"testing"
)

func TestStateMachine_ValidTransitions(t *testing.T) {
	sm := NewStateMachine()

	tests := []struct {
		name  string
		from  EvaluationStatus
		to    EvaluationStatus
		valid bool
	}{
		// Happy path — full cycle
		{"borrador → en_curso", EvaluationStatusBorrador, EvaluationStatusEnCurso, true},
		{"en_curso → carga_finalizada", EvaluationStatusEnCurso, EvaluationStatusCargaFinalizada, true},
		{"carga_finalizada → en_evaluacion", EvaluationStatusCargaFinalizada, EvaluationStatusEnEvaluacion, true},
		{"en_evaluacion → cerrada", EvaluationStatusEnEvaluacion, EvaluationStatusCerrada, true},

		// Anulación desde cualquier estado activo
		{"borrador → anulada", EvaluationStatusBorrador, EvaluationStatusAnulada, true},
		{"en_curso → anulada", EvaluationStatusEnCurso, EvaluationStatusAnulada, true},
		{"carga_finalizada → anulada", EvaluationStatusCargaFinalizada, EvaluationStatusAnulada, true},
		{"en_evaluacion → anulada", EvaluationStatusEnEvaluacion, EvaluationStatusAnulada, true},

		// Reactivación
		{"anulada → borrador", EvaluationStatusAnulada, EvaluationStatusBorrador, true},

		// Transiciones inválidas — saltos
		{"borrador → carga_finalizada (skip)", EvaluationStatusBorrador, EvaluationStatusCargaFinalizada, false},
		{"borrador → en_evaluacion (skip)", EvaluationStatusBorrador, EvaluationStatusEnEvaluacion, false},
		{"borrador → cerrada (skip)", EvaluationStatusBorrador, EvaluationStatusCerrada, false},
		{"en_curso → en_evaluacion (skip)", EvaluationStatusEnCurso, EvaluationStatusEnEvaluacion, false},
		{"en_curso → cerrada (skip)", EvaluationStatusEnCurso, EvaluationStatusCerrada, false},
		{"carga_finalizada → cerrada (skip)", EvaluationStatusCargaFinalizada, EvaluationStatusCerrada, false},
		{"carga_finalizada → en_curso (back)", EvaluationStatusCargaFinalizada, EvaluationStatusEnCurso, false},
		{"en_evaluacion → carga_finalizada (back)", EvaluationStatusEnEvaluacion, EvaluationStatusCargaFinalizada, false},

		// Cerrada es terminal — no admite transiciones (solo promote)
		{"cerrada → anything", EvaluationStatusCerrada, EvaluationStatusBorrador, false},
		{"cerrada → en_curso", EvaluationStatusCerrada, EvaluationStatusEnCurso, false},
		{"cerrada → en_evaluacion", EvaluationStatusCerrada, EvaluationStatusEnEvaluacion, false},
		{"cerrada → anulada", EvaluationStatusCerrada, EvaluationStatusAnulada, false},

		// Anulada solo a borrador
		{"anulada → en_curso", EvaluationStatusAnulada, EvaluationStatusEnCurso, false},
		{"anulada → cerrada", EvaluationStatusAnulada, EvaluationStatusCerrada, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := sm.CanTransition(tt.from, tt.to)
			if got != tt.valid {
				t.Errorf("CanTransition(%q, %q) = %v, want %v", tt.from, tt.to, got, tt.valid)
			}
		})
	}
}

func TestStateMachine_AllowedTransitions(t *testing.T) {
	sm := NewStateMachine()

	tests := []struct {
		name  string
		state EvaluationStatus
		want  int
	}{
		{"borrador allows 2 transitions", EvaluationStatusBorrador, 2},
		{"en_curso allows 2 transitions", EvaluationStatusEnCurso, 2},
		{"carga_finalizada allows 2 transitions", EvaluationStatusCargaFinalizada, 2},
		{"en_evaluacion allows 2 transitions", EvaluationStatusEnEvaluacion, 2},
		{"cerrada allows 0 transitions", EvaluationStatusCerrada, 0},
		{"anulada allows 1 transition", EvaluationStatusAnulada, 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := sm.AllowedTransitions(tt.state)
			if len(got) != tt.want {
				t.Errorf("AllowedTransitions(%q) returned %d items, want %d. Items: %v",
					tt.state, len(got), tt.want, got)
			}
		})
	}
}

func TestStateMachine_TransitionName(t *testing.T) {
	sm := NewStateMachine()

	t.Run("borrador to en_curso is iniciar", func(t *testing.T) {
		name := sm.TransitionName(EvaluationStatusBorrador, EvaluationStatusEnCurso)
		if name == "" {
			t.Error("expected non-empty transition name")
		}
	})

	t.Run("invalid transition returns empty", func(t *testing.T) {
		name := sm.TransitionName(EvaluationStatusCerrada, EvaluationStatusBorrador)
		if name != "" {
			t.Errorf("expected empty for invalid transition, got %q", name)
		}
	})
}

func TestPromotionRules_NextType(t *testing.T) {
	tests := []struct {
		name         string
		currentType  EvaluationType
		wantNext     EvaluationType
		wantOK       bool
	}{
		{"autodiagnostico → diagnostico", EvaluationTypeAutodiagnostico, EvaluationTypeDiagnostico, true},
		{"diagnostico → auditoria", EvaluationTypeDiagnostico, EvaluationTypeAuditoria, true},
		{"auditoria has no next (end of cycle)", EvaluationTypeAuditoria, "", false},
		{"medicion_espontanea has no next (standalone)", EvaluationTypeMedicionEspontanea, "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			next, ok := NextEvaluationType(tt.currentType)
			if ok != tt.wantOK {
				t.Errorf("NextEvaluationType(%q) ok = %v, want %v", tt.currentType, ok, tt.wantOK)
			}
			if ok && next != tt.wantNext {
				t.Errorf("NextEvaluationType(%q) = %q, want %q", tt.currentType, next, tt.wantNext)
			}
		})
	}
}

func TestAccessLevel_Comparison(t *testing.T) {
	tests := []struct {
		name     string
		a, b     AccessLevel
		aGteB    bool // Is a >= b?
	}{
		{"solo_lectura >= solo_lectura", AccessLevelSoloLectura, AccessLevelSoloLectura, true},
		{"carga >= solo_lectura", AccessLevelCarga, AccessLevelSoloLectura, true},
		{"evaluador >= carga", AccessLevelEvaluador, AccessLevelCarga, true},
		{"administracion >= evaluador", AccessLevelAdministracion, AccessLevelEvaluador, true},
		{"solo_lectura < carga", AccessLevelSoloLectura, AccessLevelCarga, false},
		{"carga < evaluador", AccessLevelCarga, AccessLevelEvaluador, false},
		{"evaluador < administracion", AccessLevelEvaluador, AccessLevelAdministracion, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := accessLevelOrder[tt.a] >= accessLevelOrder[tt.b]
			if got != tt.aGteB {
				t.Errorf("accessLevelOrder[%q]=%d >= accessLevelOrder[%q]=%d = %v, want %v",
					tt.a, accessLevelOrder[tt.a], tt.b, accessLevelOrder[tt.b], got, tt.aGteB)
			}
		})
	}
}

func TestScopeProgress_PercentageMatchesCompletionPercent(t *testing.T) {
	// B03: Percentage field must equal CompletionPercent and both appear in JSON.
	progress := ScopeProgress{
		ScopeID:             "test",
		ScopeName:           "Test Scope",
		ScopeAcronym:        "TS",
		TotalIndicators:     10,
		CompletedIndicators: 5,
		CompletionPercent:   50.0,
		Percentage:          50.0,
		Status:              "orange",
	}

	data, err := json.Marshal(progress)
	if err != nil {
		t.Fatalf("marshal ScopeProgress: %v", err)
	}

	var decoded map[string]interface{}
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	compPct, hasComp := decoded["completion_percent"]
	pct, hasPct := decoded["percentage"]

	if !hasComp {
		t.Error("expected completion_percent field in JSON response")
	}
	if !hasPct {
		t.Error("expected percentage field in JSON response")
	}
	if compPct != pct {
		t.Errorf("completion_percent (%v) != percentage (%v)", compPct, pct)
	}
}
