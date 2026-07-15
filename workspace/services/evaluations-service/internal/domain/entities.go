package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ── Value Objects ─────────────────────────────────────────────────────

// EvaluationType represents the type of evaluation.
type EvaluationType string

const (
	EvaluationTypeAutodiagnostico     EvaluationType = "autodiagnostico"
	EvaluationTypeDiagnostico         EvaluationType = "diagnostico"
	EvaluationTypeAuditoria           EvaluationType = "auditoria"
	EvaluationTypeMedicionEspontanea  EvaluationType = "medicion_espontanea"
)

// EvaluationStatus represents the state in the evaluation state machine.
type EvaluationStatus string

const (
	EvaluationStatusBorrador         EvaluationStatus = "borrador"
	EvaluationStatusEnCurso          EvaluationStatus = "en_curso"
	EvaluationStatusCargaFinalizada  EvaluationStatus = "carga_finalizada"
	EvaluationStatusEnEvaluacion     EvaluationStatus = "en_evaluacion"
	EvaluationStatusCerrada          EvaluationStatus = "cerrada"
	EvaluationStatusAnulada          EvaluationStatus = "anulada"
)

// AccessLevel represents the permission level for an evaluation user.
type AccessLevel string

const (
	AccessLevelSoloLectura    AccessLevel = "solo_lectura"
	AccessLevelCarga          AccessLevel = "carga"
	AccessLevelEvaluador      AccessLevel = "evaluador"
	AccessLevelAdministracion AccessLevel = "administracion"
)

// ActionStatus represents the state of an action.
type ActionStatus string

const (
	ActionStatusIdea           ActionStatus = "idea"
	ActionStatusEnPlanificacion ActionStatus = "en_planificacion"
	ActionStatusEnEjecucion    ActionStatus = "en_ejecucion"
	ActionStatusFinalizada     ActionStatus = "finalizada"
	ActionStatusDescartada     ActionStatus = "descartada"
)

// IndicatorType represents the type of an indicator.
type IndicatorType string

const (
	IndicatorTypeGradient IndicatorType = "gradient"
	IndicatorTypeBoolean  IndicatorType = "boolean"
	IndicatorTypeNumeric  IndicatorType = "numeric"
	IndicatorTypeSuma     IndicatorType = "suma"
)

// GpStatus represents the status of a good practice designation.
type GpStatus string

const (
	GpStatusDesignated GpStatus = "designated"
	GpStatusApproved   GpStatus = "approved"
	GpStatusRejected   GpStatus = "rejected"
)

// DtiPlanStatus represents the status of a DTI plan.
type DtiPlanStatus string

const (
	DtiPlanStatusActivo  DtiPlanStatus = "activo"
	DtiPlanStatusCerrado DtiPlanStatus = "cerrado"
)

// EvidenceType represents the type of evidence for an action.
type EvidenceType string

const (
	EvidenceTypeDocument    EvidenceType = "document"
	EvidenceTypeURL         EvidenceType = "url"
	EvidenceTypeAudiovisual EvidenceType = "audiovisual"
	EvidenceTypePress       EvidenceType = "press"
)

// AxisEnum represents the 5 DTI axes.
type AxisEnum string

const (
	AxisGOB AxisEnum = "gob"
	AxisINN AxisEnum = "inn"
	AxisTEC AxisEnum = "tec"
	AxisSOST AxisEnum = "sost"
	AxisACC  AxisEnum = "acc"
)

// ── 1. Destination ─────────────────────────────────────────────────────

type Destination struct {
	ID                uuid.UUID  `json:"id"`
	Name              string     `json:"name"`
	Country           string     `json:"country"`
	SubnationalLevelID *uuid.UUID `json:"subnational_level_id,omitempty"`
	TypologyID         *uuid.UUID `json:"typology_id,omitempty"`
	PopulationRangeID  *uuid.UUID `json:"population_range_id,omitempty"`
	RegionID           *uuid.UUID `json:"region_id,omitempty"`
	MemberTypeID       *uuid.UUID `json:"member_type_id,omitempty"`
	Lat               *float64   `json:"lat,omitempty"`
	Lng               *float64   `json:"lng,omitempty"`
	IsAdhered         bool       `json:"is_adhered"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// ── 2. Evaluation ──────────────────────────────────────────────────────

type Evaluation struct {
	ID                  uuid.UUID        `json:"id"`
	DestinationID       uuid.UUID        `json:"destination_id"`
	Name                string           `json:"name"`
	Type                EvaluationType   `json:"type"`
	Status              EvaluationStatus `json:"status"`
	StartDate           *time.Time       `json:"start_date,omitempty"`
	EndDate             *time.Time       `json:"end_date,omitempty"`
	HasExternalEvaluator bool            `json:"has_external_evaluator"`
	PromotedFromID      *uuid.UUID       `json:"promoted_from_id,omitempty"`
	CreatedBy           uuid.UUID        `json:"created_by"`
	CreatedByName       string           `json:"created_by_name,omitempty"`
	CreatedAt           time.Time        `json:"created_at"`
	UpdatedAt           time.Time        `json:"updated_at"`
}

// ── 3. EvaluationUser (access control) ─────────────────────────────────

type EvaluationUser struct {
	EvaluationID uuid.UUID   `json:"evaluation_id"`
	UserID       uuid.UUID   `json:"user_id"`
	AccessLevel  AccessLevel `json:"access_level"`
	UserName     string      `json:"user_name,omitempty"`
	UserEmail    string      `json:"user_email,omitempty"`
	IsImplicit   bool        `json:"is_implicit"`
	// ID is nil for implicit entries (not revocable by direct grant)
	ID           *uuid.UUID  `json:"id,omitempty"`
}

// ── 4. Scope ───────────────────────────────────────────────────────────

type Scope struct {
	ID          uuid.UUID `json:"id"`
	Axis        AxisEnum  `json:"axis"`
	Acronym     string    `json:"acronym"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	SortOrder   int       `json:"sort_order"`
}

// ── 5. Requirement ─────────────────────────────────────────────────────

type Requirement struct {
	ID          uuid.UUID `json:"id"`
	ScopeID     uuid.UUID `json:"scope_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

// ── 6. Indicator ───────────────────────────────────────────────────────

type Indicator struct {
	ID            uuid.UUID       `json:"id"`
	RequirementID uuid.UUID       `json:"requirement_id"`
	Code          string          `json:"code"`
	Name          string          `json:"name"`
	Description   string          `json:"description"`
	Type          IndicatorType   `json:"type"`
	Criteria      json.RawMessage `json:"criteria"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

// ── 7a. IndicatorWithValue ─────────────────────────────────────────────

type IndicatorWithValue struct {
	ID                   uuid.UUID       `json:"id"`
	Code                 string          `json:"code"`
	Name                 string          `json:"name"`
	Description          *string         `json:"description,omitempty"`
	Type                 IndicatorType   `json:"type"`
	Criteria             json.RawMessage `json:"criteria"`
	RequirementID        uuid.UUID       `json:"requirement_id"`
	RequirementCode      string          `json:"requirement_code"`
	AxisID               string          `json:"axis_id"`
	DestinationValue     *int            `json:"destination_value,omitempty"`
	EvaluatorValue       *int            `json:"evaluator_value,omitempty"`
	IsCompleted          bool            `json:"is_completed"`
	IsVerified           bool            `json:"is_verified"`
	DestinationObs       *string         `json:"destination_observations,omitempty"`
	EvaluatorObs         *string         `json:"evaluator_observations,omitempty"`
	Meta                 *int            `json:"meta,omitempty"`
	MetaDate             *time.Time      `json:"meta_date,omitempty"`
	AnalisisIA           *string         `json:"analisis_ia,omitempty"`
	SugerenciasMejoraIA  *string         `json:"sugerencias_mejora_ia,omitempty"`
	HasExternalEvaluator bool            `json:"has_external_evaluator"`
	HasEvidence          bool            `json:"has_evidence"`
}

// ── 7. IndicatorValue ──────────────────────────────────────────────────

type IndicatorValue struct {
	ID                      uuid.UUID       `json:"id"`
	IndicatorID             uuid.UUID       `json:"indicator_id"`
	EvaluationID            uuid.UUID       `json:"evaluation_id"`
	DestinationValue        *int            `json:"destination_value,omitempty"`
	EvaluatorValue          *int            `json:"evaluator_value,omitempty"`
	Meta                    *int            `json:"meta,omitempty"`
	MetaDate                *time.Time      `json:"meta_date,omitempty"`
	DestinationObservations *string         `json:"destination_observations,omitempty"`
	EvaluatorObservations   *string         `json:"evaluator_observations,omitempty"`
	IsVerified              bool            `json:"is_verified"`
	VerifiedBy              *string         `json:"verified_by,omitempty"`
	VerifiedAt              *time.Time      `json:"verified_at,omitempty"`
	IsEditingEnabled        bool            `json:"is_editing_enabled"`
	AnalisisIA              *string         `json:"analisis_ia,omitempty"`
	SugerenciasMejoraIA     *string         `json:"sugerencias_mejora_ia,omitempty"`
	CreatedAt               time.Time       `json:"created_at"`
	UpdatedAt               time.Time       `json:"updated_at"`
}

// ── 8. IndicatorHistory ────────────────────────────────────────────────

type IndicatorHistory struct {
	ID                   uuid.UUID  `json:"id"`
	IndicatorValueID     uuid.UUID  `json:"indicator_value_id"`
	PreviousEvaluationID uuid.UUID  `json:"previous_evaluation_id"`
	DestinationValue     *int       `json:"destination_value,omitempty"`
	EvaluatorValue       *int       `json:"evaluator_value,omitempty"`
	Meta                 *int       `json:"meta,omitempty"`
	Observations         *string    `json:"observations,omitempty"`
	Source               string     `json:"source"`
	ModifiedBy           string     `json:"modified_by"`
	CreatedAt            time.Time  `json:"created_at"`
}

// ── 9. IndicatorMessage ────────────────────────────────────────────────

type IndicatorMessage struct {
	ID               uuid.UUID `json:"id"`
	IndicatorValueID uuid.UUID `json:"indicator_value_id"`
	UserID           uuid.UUID `json:"user_id"`
	Message          string    `json:"message"`
	CreatedAt        time.Time `json:"created_at"`
	UserName         string    `json:"user_name,omitempty"`
	UserAvatar       string    `json:"user_avatar,omitempty"`
}

// ── 10. Action ─────────────────────────────────────────────────────────

type Action struct {
	ID                uuid.UUID      `json:"id"`
	DestinationID     uuid.UUID      `json:"destination_id"`
	Name              string         `json:"name"`
	Summary           *string        `json:"summary,omitempty"`
	Objective         *string        `json:"objective,omitempty"`
	Status            ActionStatus   `json:"status"`
	Axes              json.RawMessage `json:"axes,omitempty"`
	Scopes            json.RawMessage `json:"scopes,omitempty"`
	ExtendedDescription *string      `json:"extended_description,omitempty"`
	Complexity        *string        `json:"complexity,omitempty"`
	Horizon           *string        `json:"horizon,omitempty"`
	StartDate         *time.Time     `json:"start_date,omitempty"`
	EndDate           *time.Time     `json:"end_date,omitempty"`
	ResponsiblePerson *string        `json:"responsible_person,omitempty"`
	ResponsibleAreaID *uuid.UUID    `json:"responsible_area_id,omitempty"`
	ActorReferences   *string        `json:"actors,omitempty"`
	ODS               json.RawMessage `json:"ods,omitempty"`
	BudgetAmount      *float64       `json:"budget_amount,omitempty"`
	BudgetCurrency    string         `json:"budget_currency"`
	BudgetExecuted    *float64       `json:"budget_executed,omitempty"`
	BudgetSource      *string        `json:"budget_source,omitempty"`
	PhotoURL          *string        `json:"photo_url,omitempty"`
	WebsiteURL        *string        `json:"website_url,omitempty"`
	Awards            *string        `json:"awards,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	LinkedIndicators  []ActionIndicatorLink `json:"linked_indicators,omitempty"`
	GoodPractice     *GoodPractice         `json:"good_practice,omitempty"`
}

// ── 11. ActionEvidence ─────────────────────────────────────────────────

type ActionEvidence struct {
	ID           uuid.UUID    `json:"id"`
	ActionID     uuid.UUID    `json:"action_id"`
	EvaluationID uuid.UUID    `json:"evaluation_id"`
	Type         EvidenceType `json:"type"`
	URL          *string      `json:"url,omitempty"`
	FilePath     *string      `json:"file_path,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
}

// ── 12. ActionIndicatorLink ────────────────────────────────────────────

type ActionIndicatorLink struct {
	ID                uuid.UUID    `json:"id"`
	ActionID          uuid.UUID    `json:"action_id"`
	IndicatorID       uuid.UUID    `json:"indicator_id"`
	EvaluationID      uuid.UUID    `json:"evaluation_id"`
	ActionStatusAtLink ActionStatus `json:"action_status_at_link"`
	CreatedAt         time.Time    `json:"created_at"`
}

// ── 13. GoodPractice ───────────────────────────────────────────────────

type GoodPractice struct {
	ID            uuid.UUID  `json:"id"`
	ActionID      uuid.UUID  `json:"action_id"`
	DesignatedBy  uuid.UUID  `json:"designated_by"`
	DesignatedAt  time.Time  `json:"designated_at"`
	ApprovedBy    *uuid.UUID `json:"approved_by,omitempty"`
	ApprovedAt    *time.Time `json:"approved_at,omitempty"`
	Status        GpStatus   `json:"status"`
}

// ── 14. DtiPlan ────────────────────────────────────────────────────────

type DtiPlan struct {
	ID            uuid.UUID     `json:"id"`
	DestinationID uuid.UUID     `json:"destination_id"`
	Name          string        `json:"name"`
	StartDate     time.Time     `json:"start_date"`
	EndDate       time.Time     `json:"end_date"`
	Status        DtiPlanStatus `json:"status"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

// ── 15. DtiPlanGoal ────────────────────────────────────────────────────

type DtiPlanGoal struct {
	ID           uuid.UUID  `json:"id"`
	DtiPlanID    uuid.UUID  `json:"dti_plan_id"`
	IndicatorID  uuid.UUID  `json:"indicator_id"`
	CurrentScore *int       `json:"current_score,omitempty"`
	TargetScore  int        `json:"target_score"`
	TargetDate   *time.Time `json:"target_date,omitempty"`
}

// ── 16. AxisLevel ──────────────────────────────────────────────────────

type AxisLevel struct {
	ID               uuid.UUID `json:"id"`
	Axis             AxisEnum  `json:"axis"`
	ObjectivePercent float64   `json:"objective_percent"`
	SortOrder        int       `json:"sort_order"`
}

// ── 17. SubnationalLevel ───────────────────────────────────────────────

type SubnationalLevel struct {
	ID      uuid.UUID `json:"id"`
	Country string    `json:"country"`
	Name    string    `json:"name"`
}

// ── 18. DestinationTypology ────────────────────────────────────────────

type DestinationTypology struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

// ── 19. PopulationRange ────────────────────────────────────────────────

type PopulationRange struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

// ── 20. Region ─────────────────────────────────────────────────────────

type Region struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

// ── 21. MemberType ─────────────────────────────────────────────────────

type MemberType struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

// ── 22. Report ──────────────────────────────────────────────────────────

type Report struct {
	ID            uuid.UUID  `json:"id"`
	EvaluationID  *uuid.UUID `json:"evaluation_id,omitempty"`
	DestinationID uuid.UUID  `json:"destination_id"`
	Year          int        `json:"year"`
	Name          string     `json:"name"`
	FileURL       *string    `json:"file_url,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
}

// ── 23. ResponsibleArea ────────────────────────────────────────────────

type ResponsibleArea struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

// ActionContributesToCompliance determines if an action should contribute
// to indicator compliance based on its status and evidence count.
// Rule B07: Only EnEjecución (with ≥1 evidence) or Finalizada contributes.
func ActionContributesToCompliance(status ActionStatus, evidenceCount int) bool {
	switch status {
	case ActionStatusEnEjecucion:
		return evidenceCount >= 1
	case ActionStatusFinalizada:
		return true
	default:
		return false
	}
}

// ODSGoal represents a Sustainable Development Goal attached to an action.
type ODSGoal struct {
	OdsID        string `json:"ods_id"`
	Contribution string `json:"contribution"`
}

// ── Request/Response DTOs ──────────────────────────────────────────────

type HealthResponse struct {
	Status string `json:"status"`
}

// SaveDestinationValueResponse wraps an indicator value with optional
// status transition metadata for the auto-transition feature.
type SaveDestinationValueResponse struct {
	*IndicatorValue
	StatusChanged *bool             `json:"status_changed,omitempty"`
	NewStatus     *EvaluationStatus `json:"new_status,omitempty"`
}

type RootResponse struct {
	Message string `json:"message"`
}

// ActionTranslation stores machine-generated translations of action content
// for dynamic content i18n (e.g., DeepL es→pt).
type ActionTranslation struct {
	ID                  uuid.UUID       `json:"id"`
	ActionID            uuid.UUID       `json:"action_id"`
	Locale              string          `json:"locale"`
	Name                string          `json:"name"`
	Summary             *string         `json:"summary,omitempty"`
	Description         *string         `json:"description,omitempty"`
	ODS                 json.RawMessage `json:"ods,omitempty"`
	TranslatedAt        time.Time       `json:"translated_at"`
	TranslationReviewed bool            `json:"translation_reviewed"`
	ReviewedBy          *uuid.UUID      `json:"reviewed_by,omitempty"`
	ReviewedAt          *time.Time      `json:"reviewed_at,omitempty"`
}

// CatalogTranslation stores machine-generated translations of catalog entities
// (scopes, requirements, indicators, member types, etc.) for dynamic content i18n.
type CatalogTranslation struct {
	ID                  uuid.UUID  `json:"id"`
	EntityType          string     `json:"entity_type"`
	EntityID            uuid.UUID  `json:"entity_id"`
	Locale              string     `json:"locale"`
	Name                *string    `json:"name,omitempty"`
	Description         *string    `json:"description,omitempty"`
	Criteria            *string    `json:"criteria,omitempty"` // JSON string for indicator criteria translation
	TranslatedAt        time.Time  `json:"translated_at"`
	TranslationReviewed bool       `json:"translation_reviewed"`
	ReviewedBy          *uuid.UUID `json:"reviewed_by,omitempty"`
	ReviewedAt          *time.Time `json:"reviewed_at,omitempty"`
}

// PublicGoodPracticeView is the DTO for the public good practice bank endpoint.
type PublicGoodPracticeView struct {
	ActionID         uuid.UUID          `json:"action_id"`
	ActionName       string             `json:"action_name"`
	ActionSummary    *string            `json:"action_summary,omitempty"`
	ActionDescription *string           `json:"action_description,omitempty"`
	DestinationName  string             `json:"destination_name"`
	Country          string             `json:"country"`
	Typology         *string            `json:"typology,omitempty"`
	PopulationRange  *string            `json:"population_range,omitempty"`
	Axes             json.RawMessage    `json:"axes,omitempty"`
	Scopes           json.RawMessage    `json:"scopes,omitempty"`
	ODS              json.RawMessage    `json:"ods,omitempty"`
	PhotoURL         *string            `json:"photo_url,omitempty"`
	EvidenceDocs     []string           `json:"evidence_docs,omitempty"`
	EvidenceURLs     []string           `json:"evidence_urls,omitempty"`
	AudiovisualLinks []string           `json:"audiovisual_links,omitempty"`
	PressNotes       []string           `json:"press_notes,omitempty"`
	WebsiteURL       *string            `json:"website_url,omitempty"`
	Awards           *string            `json:"awards,omitempty"`
}
