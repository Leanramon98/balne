package domain

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestEvaluationType_Values(t *testing.T) {
	tests := []struct {
		name  string
		etype EvaluationType
		want  string
	}{
		{"autodiagnostico", EvaluationTypeAutodiagnostico, "autodiagnostico"},
		{"diagnostico", EvaluationTypeDiagnostico, "diagnostico"},
		{"auditoria", EvaluationTypeAuditoria, "auditoria"},
		{"medicion_espontanea", EvaluationTypeMedicionEspontanea, "medicion_espontanea"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.etype) != tt.want {
				t.Errorf("got %q, want %q", string(tt.etype), tt.want)
			}
		})
	}
}

func TestEvaluationStatus_Values(t *testing.T) {
	tests := []struct {
		name   string
		status EvaluationStatus
		want   string
	}{
		{"borrador", EvaluationStatusBorrador, "borrador"},
		{"en_curso", EvaluationStatusEnCurso, "en_curso"},
		{"carga_finalizada", EvaluationStatusCargaFinalizada, "carga_finalizada"},
		{"en_evaluacion", EvaluationStatusEnEvaluacion, "en_evaluacion"},
		{"cerrada", EvaluationStatusCerrada, "cerrada"},
		{"anulada", EvaluationStatusAnulada, "anulada"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.status) != tt.want {
				t.Errorf("got %q, want %q", string(tt.status), tt.want)
			}
		})
	}
}

func TestAccessLevel_Ordered(t *testing.T) {
	// Verify that the access level strings are correct
	if string(AccessLevelSoloLectura) != "solo_lectura" {
		t.Errorf("got %q", string(AccessLevelSoloLectura))
	}
	if string(AccessLevelCarga) != "carga" {
		t.Errorf("got %q", string(AccessLevelCarga))
	}
	if string(AccessLevelEvaluador) != "evaluador" {
		t.Errorf("got %q", string(AccessLevelEvaluador))
	}
	if string(AccessLevelAdministracion) != "administracion" {
		t.Errorf("got %q", string(AccessLevelAdministracion))
	}
}

func TestActionStatus_Values(t *testing.T) {
	tests := []struct {
		name   string
		status ActionStatus
		want   string
	}{
		{"idea", ActionStatusIdea, "idea"},
		{"en_planificacion", ActionStatusEnPlanificacion, "en_planificacion"},
		{"en_ejecucion", ActionStatusEnEjecucion, "en_ejecucion"},
		{"finalizada", ActionStatusFinalizada, "finalizada"},
		{"descartada", ActionStatusDescartada, "descartada"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.status) != tt.want {
				t.Errorf("got %q, want %q", string(tt.status), tt.want)
			}
		})
	}
}

func TestDestination_NullableFields(t *testing.T) {
	// RED: Verify Destination handles nullable FK fields
	t.Run("default zero values", func(t *testing.T) {
		d := Destination{}
		if d.SubnationalLevelID != nil {
			t.Error("expected SubnationalLevelID to be nil")
		}
		if d.TypologyID != nil {
			t.Error("expected TypologyID to be nil")
		}
		if d.Lat != nil {
			t.Error("expected Lat to be nil")
		}
		if d.IsAdhered {
			t.Error("expected IsAdhered to be false")
		}
	})

	t.Run("set and read nullable fields", func(t *testing.T) {
		id := uuid.New()
		lat := 40.4168
		d := Destination{
			ID:                uuid.New(),
			Name:              "Test City",
			Country:           "Testland",
			SubnationalLevelID: &id,
			Lat:               &lat,
			IsAdhered:         true,
		}
		if d.SubnationalLevelID == nil {
			t.Fatal("expected SubnationalLevelID to be non-nil")
		}
		if *d.SubnationalLevelID != id {
			t.Errorf("got %v, want %v", *d.SubnationalLevelID, id)
		}
		if d.Lat == nil {
			t.Fatal("expected Lat to be non-nil")
		}
		if *d.Lat != 40.4168 {
			t.Errorf("got %f, want 40.4168", *d.Lat)
		}
		if !d.IsAdhered {
			t.Error("expected IsAdhered to be true")
		}
	})
}

func TestIndicator_CriteriaJSON(t *testing.T) {
	// RED: Verify Indicator can hold criteria as json.RawMessage
	t.Run("gradient criteria", func(t *testing.T) {
		criteria := json.RawMessage(`[{"level":0,"value":0,"description":"No"},{"level":1,"value":100,"description":"Sí"}]`)
		ind := Indicator{
			ID:          uuid.New(),
			Code:        "TEST_01.NI1",
			Name:        "Test indicator",
			Type:        IndicatorTypeGradient,
			Criteria:    criteria,
			RequirementID: uuid.New(),
		}
		if ind.Criteria == nil {
			t.Fatal("expected Criteria to be non-nil")
		}
		var parsed []map[string]interface{}
		if err := json.Unmarshal(ind.Criteria, &parsed); err != nil {
			t.Fatalf("unmarshal criteria: %v", err)
		}
		if len(parsed) != 2 {
			t.Errorf("expected 2 levels, got %d", len(parsed))
		}
		if parsed[1]["description"] != "Sí" {
			t.Errorf("expected 'Sí', got %v", parsed[1]["description"])
		}
	})

	t.Run("empty criteria default", func(t *testing.T) {
		ind := Indicator{Criteria: json.RawMessage(`[]`)}
		if string(ind.Criteria) != "[]" {
			t.Errorf("got %s, want '[]'", string(ind.Criteria))
		}
	})
}

func TestIndicatorValue_AIFields(t *testing.T) {
	// RED: Verify AI fields exist with correct types
	t.Run("AI fields nullable", func(t *testing.T) {
		iv := IndicatorValue{}
		if iv.AnalisisIA != nil {
			t.Error("expected AnalisisIA to be nil")
		}
		if iv.SugerenciasMejoraIA != nil {
			t.Error("expected SugerenciasMejoraIA to be nil")
		}
	})

	t.Run("AI fields settable", func(t *testing.T) {
		analysis := "Análisis automático completado"
		suggestions := "Mejora la accesibilidad web"
		iv := IndicatorValue{
			AnalisisIA:          &analysis,
			SugerenciasMejoraIA: &suggestions,
		}
		if iv.AnalisisIA == nil || *iv.AnalisisIA != analysis {
			t.Errorf("AnalisisIA: got %v", iv.AnalisisIA)
		}
		if iv.SugerenciasMejoraIA == nil || *iv.SugerenciasMejoraIA != suggestions {
			t.Errorf("SugerenciasMejoraIA: got %v", iv.SugerenciasMejoraIA)
		}
	})
}

func TestEvaluation_PromotedFrom(t *testing.T) {
	// RED: Verify Evaluation has PromotedFromID for promotion tracking
	t.Run("nil by default", func(t *testing.T) {
		e := Evaluation{}
		if e.PromotedFromID != nil {
			t.Error("expected PromotedFromID to be nil")
		}
	})

	t.Run("set promoted from", func(t *testing.T) {
		prevID := uuid.New()
		e := Evaluation{
			ID:             uuid.New(),
			DestinationID:  uuid.New(),
			Name:           "Test Eval Std",
			Type:           EvaluationTypeAutodiagnostico,
			Status:         EvaluationStatusCerrada,
			PromotedFromID: &prevID,
			CreatedBy:      uuid.New(),
			CreatedAt:      time.Now(),
		}
		if e.PromotedFromID == nil {
			t.Fatal("expected PromotedFromID to be non-nil")
		}
		if *e.PromotedFromID != prevID {
			t.Errorf("got %v, want %v", *e.PromotedFromID, prevID)
		}
	})
}

func TestGoodPractice_Lifecycle(t *testing.T) {
	// RED: Verify GoodPractice has correct lifecycle fields
	t.Run("default status", func(t *testing.T) {
		gp := GoodPractice{}
		if gp.Status != "" {
			t.Errorf("expected empty status, got %q", gp.Status)
		}
	})

	t.Run("designated", func(t *testing.T) {
		gp := GoodPractice{
			ID:           uuid.New(),
			ActionID:     uuid.New(),
			DesignatedBy: uuid.New(),
			DesignatedAt: time.Now(),
			Status:       GpStatusDesignated,
		}
		if string(gp.Status) != "designated" {
			t.Errorf("got %q, want 'designated'", string(gp.Status))
		}
	})

	t.Run("approved", func(t *testing.T) {
		approvedBy := uuid.New()
		now := time.Now()
		gp := GoodPractice{
			Status:     GpStatusApproved,
			ApprovedBy: &approvedBy,
			ApprovedAt: &now,
		}
		if string(gp.Status) != "approved" {
			t.Errorf("got %q, want 'approved'", string(gp.Status))
		}
		if gp.ApprovedBy == nil {
			t.Fatal("expected ApprovedBy to be non-nil")
		}
	})
}

// ═════════════════════════════════════════════════════════════════════
// Action Compliance Rule Tests (B07)
// ═════════════════════════════════════════════════════════════════════

func TestActionContributesToCompliance(t *testing.T) {
	tests := []struct {
		name    string
		status  ActionStatus
		evCount int
		want    bool
	}{
		{
			name:    "idea_does_not_contribute",
			status:  ActionStatusIdea,
			evCount: 0,
			want:    false,
		},
		{
			name:    "en_planificacion_does_not_contribute",
			status:  ActionStatusEnPlanificacion,
			evCount: 0,
			want:    false,
		},
		{
			name:    "en_ejecucion_with_0_evidence_does_not_contribute",
			status:  ActionStatusEnEjecucion,
			evCount: 0,
			want:    false,
		},
		{
			name:    "en_ejecucion_with_1_evidence_contributes",
			status:  ActionStatusEnEjecucion,
			evCount: 1,
			want:    true,
		},
		{
			name:    "en_ejecucion_with_3_evidence_contributes",
			status:  ActionStatusEnEjecucion,
			evCount: 3,
			want:    true,
		},
		{
			name:    "finalizada_with_0_evidence_contributes",
			status:  ActionStatusFinalizada,
			evCount: 0,
			want:    true,
		},
		{
			name:    "finalizada_with_evidence_contributes",
			status:  ActionStatusFinalizada,
			evCount: 5,
			want:    true,
		},
		{
			name:    "descartada_does_not_contribute",
			status:  ActionStatusDescartada,
			evCount: 0,
			want:    false,
		},
		{
			name:    "descartada_with_evidence_does_not_contribute",
			status:  ActionStatusDescartada,
			evCount: 2,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ActionContributesToCompliance(tt.status, tt.evCount)
			if got != tt.want {
				t.Errorf("ActionContributesToCompliance(%q, %d) = %v, want %v",
					tt.status, tt.evCount, got, tt.want)
			}
		})
	}
}
