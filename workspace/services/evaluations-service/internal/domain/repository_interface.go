package domain

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
)

// Repository defines the interface for database operations.
// This enables testing of use cases with mock repositories.
type Repository interface {
	// SubnationalLevel
	FindAllSubnationalLevels(ctx context.Context) ([]*SubnationalLevel, error)
	FindSubnationalLevelByID(ctx context.Context, id uuid.UUID) (*SubnationalLevel, error)
	CreateSubnationalLevel(ctx context.Context, entity *SubnationalLevel) error
	UpdateSubnationalLevel(ctx context.Context, entity *SubnationalLevel) error
	DeleteSubnationalLevel(ctx context.Context, id uuid.UUID) error

	// DestinationTypology
	FindAllDestinationTypologies(ctx context.Context) ([]*DestinationTypology, error)
	FindDestinationTypologyByID(ctx context.Context, id uuid.UUID) (*DestinationTypology, error)
	CreateDestinationTypology(ctx context.Context, entity *DestinationTypology) error
	UpdateDestinationTypology(ctx context.Context, entity *DestinationTypology) error
	DeleteDestinationTypology(ctx context.Context, id uuid.UUID) error

	// PopulationRange
	FindAllPopulationRanges(ctx context.Context) ([]*PopulationRange, error)
	FindPopulationRangeByID(ctx context.Context, id uuid.UUID) (*PopulationRange, error)
	CreatePopulationRange(ctx context.Context, entity *PopulationRange) error
	UpdatePopulationRange(ctx context.Context, entity *PopulationRange) error
	DeletePopulationRange(ctx context.Context, id uuid.UUID) error

	// Region
	FindAllRegions(ctx context.Context) ([]*Region, error)
	FindRegionByID(ctx context.Context, id uuid.UUID) (*Region, error)
	CreateRegion(ctx context.Context, entity *Region) error
	UpdateRegion(ctx context.Context, entity *Region) error
	DeleteRegion(ctx context.Context, id uuid.UUID) error

	// MemberType
	FindAllMemberTypes(ctx context.Context) ([]*MemberType, error)
	FindMemberTypeByID(ctx context.Context, id uuid.UUID) (*MemberType, error)
	CreateMemberType(ctx context.Context, entity *MemberType) error
	UpdateMemberType(ctx context.Context, entity *MemberType) error
	DeleteMemberType(ctx context.Context, id uuid.UUID) error

	// ResponsibleArea
	FindAllResponsibleAreas(ctx context.Context) ([]*ResponsibleArea, error)
	FindResponsibleAreaByID(ctx context.Context, id uuid.UUID) (*ResponsibleArea, error)
	CreateResponsibleArea(ctx context.Context, entity *ResponsibleArea) error
	UpdateResponsibleArea(ctx context.Context, entity *ResponsibleArea) error
	DeleteResponsibleArea(ctx context.Context, id uuid.UUID) error

	// AxisLevel
	FindAllAxisLevels(ctx context.Context) ([]*AxisLevel, error)
	FindAxisLevelByID(ctx context.Context, id uuid.UUID) (*AxisLevel, error)
	CreateAxisLevel(ctx context.Context, entity *AxisLevel) error
	UpdateAxisLevel(ctx context.Context, entity *AxisLevel) error
	DeleteAxisLevel(ctx context.Context, id uuid.UUID) error

	// Scope
	FindAllScopes(ctx context.Context) ([]*Scope, error)
	FindScopeByID(ctx context.Context, id uuid.UUID) (*Scope, error)
	CreateScope(ctx context.Context, entity *Scope) error
	UpdateScope(ctx context.Context, entity *Scope) error
	DeleteScope(ctx context.Context, id uuid.UUID) error

	// Requirement
	FindAllRequirements(ctx context.Context) ([]*Requirement, error)
	FindRequirementByID(ctx context.Context, id uuid.UUID) (*Requirement, error)
	FindRequirementsByScope(ctx context.Context, scopeID uuid.UUID) ([]*Requirement, error)
	CreateRequirement(ctx context.Context, entity *Requirement) error
	UpdateRequirement(ctx context.Context, entity *Requirement) error
	DeleteRequirement(ctx context.Context, id uuid.UUID) error

	// Indicator
	FindAllIndicators(ctx context.Context) ([]*Indicator, error)
	FindIndicatorByID(ctx context.Context, id uuid.UUID) (*Indicator, error)
	FindIndicatorsByRequirement(ctx context.Context, requirementID uuid.UUID) ([]*Indicator, error)
	FindIndicatorsByScope(ctx context.Context, scopeID uuid.UUID) ([]*Indicator, error)
	FindIndicatorsByScopeAndEvaluation(ctx context.Context, scopeID uuid.UUID, evaluationID uuid.UUID) ([]*IndicatorWithValue, error)
	CreateIndicator(ctx context.Context, entity *Indicator) error
	UpdateIndicator(ctx context.Context, entity *Indicator) error
	DeleteIndicator(ctx context.Context, id uuid.UUID) error

	// Destination CRUD
	CreateDestination(ctx context.Context, d *Destination) error
	FindDestinationByID(ctx context.Context, id uuid.UUID) (*Destination, error)
	FindDestinations(ctx context.Context) ([]*Destination, error)
	UpdateDestination(ctx context.Context, d *Destination) error
	DeleteDestination(ctx context.Context, id uuid.UUID) error

	// Evaluation CRUD
	CreateEvaluation(ctx context.Context, e *Evaluation) error
	FindEvaluationByID(ctx context.Context, id uuid.UUID) (*Evaluation, error)
	FindEvaluations(ctx context.Context, destinationID, evalType, status string, limit, offset int) ([]*Evaluation, error)
	CountEvaluations(ctx context.Context, destinationID, evalType, status string) (int, error)
	UpdateEvaluation(ctx context.Context, e *Evaluation) error
	DeleteEvaluation(ctx context.Context, id uuid.UUID) error

	// Role-based scoping
	FindDestinationsByRegionID(ctx context.Context, regionID string) ([]*Destination, error)
	FindEvaluationsByDestinationIDs(ctx context.Context, destIDs []uuid.UUID, evalType, status string, limit, offset int) ([]*Evaluation, int, error)
	FindEvaluationsByUserID(ctx context.Context, userID string, evalTypes []string, status string, limit, offset int) ([]*Evaluation, int, error)

	// EvaluationUser
	GrantAccess(ctx context.Context, evaluationID, userID uuid.UUID, level AccessLevel) error
	RevokeAccess(ctx context.Context, evaluationID, userID uuid.UUID) error
	ListAccess(ctx context.Context, evaluationID uuid.UUID) ([]*EvaluationUser, error)
	GetUserAccessLevel(ctx context.Context, evaluationID, userID uuid.UUID) (AccessLevel, error)

	// Scope Progress
	GetScopeProgress(ctx context.Context, evaluationID uuid.UUID) ([]*ScopeProgress, error)

	// Action CRUD
	CreateAction(ctx context.Context, a *Action) error
	FindActionByID(ctx context.Context, id uuid.UUID) (*Action, error)
	FindAllActions(ctx context.Context) ([]*Action, error)
	FindActionsByDestination(ctx context.Context, destinationID uuid.UUID) ([]*Action, error)
	FindActionsByScope(ctx context.Context, scopeID uuid.UUID) ([]*Action, error)
	UpdateAction(ctx context.Context, a *Action) error
	DeleteAction(ctx context.Context, id uuid.UUID) error

	// ActionEvidence
	CreateActionEvidence(ctx context.Context, e *ActionEvidence) error
	FindActionEvidenceByID(ctx context.Context, id uuid.UUID) (*ActionEvidence, error)
	ListActionEvidence(ctx context.Context, actionID uuid.UUID) ([]*ActionEvidence, error)
	CountActionEvidence(ctx context.Context, actionID uuid.UUID) (int, error)
	DeleteActionEvidence(ctx context.Context, id uuid.UUID) error

	// ActionIndicatorLink
	CreateActionIndicatorLink(ctx context.Context, l *ActionIndicatorLink) error
	DeleteActionIndicatorLink(ctx context.Context, actionID, indicatorID, evaluationID uuid.UUID) error
	ListActionIndicatorLinks(ctx context.Context, actionID uuid.UUID) ([]*ActionIndicatorLink, error)

	// GoodPractice
	CreateGoodPractice(ctx context.Context, gp *GoodPractice) error
	FindGoodPracticeByActionID(ctx context.Context, actionID uuid.UUID) (*GoodPractice, error)
	UpdateGoodPractice(ctx context.Context, gp *GoodPractice) error

	// DtiPlan CRUD
	CreateDtiPlan(ctx context.Context, p *DtiPlan) error
	FindDtiPlanByID(ctx context.Context, id uuid.UUID) (*DtiPlan, error)
	FindDtiPlansByDestination(ctx context.Context, destinationID uuid.UUID) ([]*DtiPlan, error)
	UpdateDtiPlan(ctx context.Context, p *DtiPlan) error
	DeleteDtiPlan(ctx context.Context, id uuid.UUID) error
	CountDtiPlanGoals(ctx context.Context, dtiPlanID uuid.UUID) (int, error)

	// DtiPlanGoal
	CreateDtiPlanGoal(ctx context.Context, g *DtiPlanGoal) error
	UpdateDtiPlanGoal(ctx context.Context, g *DtiPlanGoal) error
	DeleteDtiPlanGoal(ctx context.Context, id uuid.UUID) error
	ListDtiPlanGoals(ctx context.Context, dtiPlanID uuid.UUID) ([]*DtiPlanGoal, error)
	FindDtiPlanGoalByID(ctx context.Context, id uuid.UUID) (*DtiPlanGoal, error)

	// FindLatestIndicatorValueByDestination returns the latest indicator value
	// for a given indicator within any evaluation of a destination.
	// Returns nil if no value has been recorded yet.
	FindLatestIndicatorValueByDestination(ctx context.Context, destinationID uuid.UUID, indicatorID uuid.UUID) (*IndicatorValue, error)

	// Public Good Practices (no auth)
	// Returns approved GoodPractices with full Action details for the public bank.
	// When filters["locale"] is "pt", LEFT JOINs action_translation and COALESCEs translated fields.
	FindApprovedGoodPractices(ctx context.Context, filters map[string]string) ([]*PublicGoodPracticeView, error)
	FindApprovedGoodPracticeByActionID(ctx context.Context, actionID uuid.UUID, locale string) (*PublicGoodPracticeView, error)

	// ActionTranslation CRUD
	CreateTranslation(ctx context.Context, t *ActionTranslation) error
	FindTranslationByActionAndLocale(ctx context.Context, actionID uuid.UUID, locale string) (*ActionTranslation, error)
	ListPendingTranslations(ctx context.Context, locale string, reviewed *bool) ([]*ActionTranslation, error)
	UpdateTranslation(ctx context.Context, t *ActionTranslation) error
	EnsureActionTranslation(ctx context.Context, actionID uuid.UUID, locale, sourceName, sourceSummary, sourceDescription, sourceODS string) error

	// CatalogTranslation CRUD
	CreateCatalogTranslation(ctx context.Context, t *CatalogTranslation) error
	FindCatalogTranslation(ctx context.Context, entityType string, entityID uuid.UUID, locale string) (*CatalogTranslation, error)
	ListCatalogTranslations(ctx context.Context, entityType, locale string, reviewed *bool) ([]*CatalogTranslation, error)
	UpdateCatalogTranslation(ctx context.Context, t *CatalogTranslation) error

	// Promotion (transactional)
	BeginTx(ctx context.Context) (*sql.Tx, error)
	CreateEvaluationTx(tx *sql.Tx, e *Evaluation) error
	CopyIndicatorValuesTx(tx *sql.Tx, sourceEvalID, newEvalID uuid.UUID) (map[uuid.UUID]uuid.UUID, error)
	CreateIndicatorHistoryTx(tx *sql.Tx, sourceEvalID uuid.UUID, newIVID uuid.UUID, prevIndicatorValueID uuid.UUID) error
	CopyActionIndicatorLinksTx(tx *sql.Tx, sourceEvalID, newEvalID uuid.UUID) error
	// GetSourceIndicatorValueIDs returns id, indicator_id pairs for a given evaluation.
	GetSourceIndicatorValueIDs(ctx context.Context, evaluationID uuid.UUID) ([]SourceIndicatorRow, error)

	// IndicatorValue
	FindIndicatorValueByID(ctx context.Context, id uuid.UUID) (*IndicatorValue, error)
	FindIndicatorValueByEvalAndIndicator(ctx context.Context, evaluationID, indicatorID uuid.UUID) (*IndicatorValue, error)
	CreateIndicatorValue(ctx context.Context, iv *IndicatorValue) error
	UpdateIndicatorValue(ctx context.Context, iv *IndicatorValue) error
	DeleteIndicatorValueContent(ctx context.Context, id uuid.UUID) error

	// IndicatorHistory
	CreateIndicatorHistory(ctx context.Context, h *IndicatorHistory) error
	ListIndicatorHistory(ctx context.Context, indicatorValueID uuid.UUID) ([]*IndicatorHistory, error)

	// IndicatorMessage
	CreateIndicatorMessage(ctx context.Context, m *IndicatorMessage) error
	ListIndicatorMessages(ctx context.Context, indicatorValueID uuid.UUID) ([]*IndicatorMessage, error)

	// Results
	FindResults(ctx context.Context, filters ResultsFilters) ([]*ResultsData, error)

	// Report
	FindAllReports(ctx context.Context) ([]*Report, error)
	FindReportByID(ctx context.Context, id uuid.UUID) (*Report, error)
	CreateReport(ctx context.Context, entity *Report) error
}

// SourceIndicatorRow is a minimal DTO for source indicator values during promotion.
type SourceIndicatorRow struct {
	ID          uuid.UUID
	IndicatorID uuid.UUID
}
