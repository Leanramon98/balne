// User-owned HTTP handler registration.
// Replaces the broken generated handlers_generated.go (which has {id} template bug).
package httpadapter

import (
	"database/sql"
	"evaluations-service/internal/usecases"

	"github.com/labstack/echo/v4"
)

// RegisterRoutes registers all API routes on the given Echo group.
// This is the CORRECT implementation — the generated handlers_generated.go
// has template bugs ({id} not converted, hyphens in identifiers).
func RegisterRoutes(e *echo.Group, uc *usecases.Logic, db *sql.DB) {
	// ── Admin Catalog CRUD ──────────────────────────────────────────
	// SubnationalLevels
	e.GET("/admin/subnational-levels", uc.HandleListSubnationalLevels)
	e.POST("/admin/subnational-levels", uc.HandleCreateSubnationalLevel)
	e.GET("/admin/subnational-levels/:id", uc.HandleGetSubnationalLevel)
	e.PUT("/admin/subnational-levels/:id", uc.HandleUpdateSubnationalLevel)
	e.DELETE("/admin/subnational-levels/:id", uc.HandleDeleteSubnationalLevel)

	// DestinationTypologies
	e.GET("/admin/typologies", uc.HandleListDestinationTypologies)
	e.POST("/admin/typologies", uc.HandleCreateDestinationTypology)
	e.GET("/admin/typologies/:id", uc.HandleGetDestinationTypology)
	e.PUT("/admin/typologies/:id", uc.HandleUpdateDestinationTypology)
	e.DELETE("/admin/typologies/:id", uc.HandleDeleteDestinationTypology)

	// PopulationRanges
	e.GET("/admin/population-ranges", uc.HandleListPopulationRanges)
	e.POST("/admin/population-ranges", uc.HandleCreatePopulationRange)
	e.GET("/admin/population-ranges/:id", uc.HandleGetPopulationRange)
	e.PUT("/admin/population-ranges/:id", uc.HandleUpdatePopulationRange)
	e.DELETE("/admin/population-ranges/:id", uc.HandleDeletePopulationRange)

	// Regions
	e.GET("/admin/regions", uc.HandleListRegions)
	e.POST("/admin/regions", uc.HandleCreateRegion)
	e.GET("/admin/regions/:id", uc.HandleGetRegion)
	e.PUT("/admin/regions/:id", uc.HandleUpdateRegion)
	e.DELETE("/admin/regions/:id", uc.HandleDeleteRegion)

	// MemberTypes
	e.GET("/admin/member-types", uc.HandleListMemberTypes)
	e.POST("/admin/member-types", uc.HandleCreateMemberType)
	e.GET("/admin/member-types/:id", uc.HandleGetMemberType)
	e.PUT("/admin/member-types/:id", uc.HandleUpdateMemberType)
	e.DELETE("/admin/member-types/:id", uc.HandleDeleteMemberType)

	// ResponsibleAreas
	e.GET("/admin/responsible-areas", uc.HandleListResponsibleAreas)
	e.POST("/admin/responsible-areas", uc.HandleCreateResponsibleArea)
	e.GET("/admin/responsible-areas/:id", uc.HandleGetResponsibleArea)
	e.PUT("/admin/responsible-areas/:id", uc.HandleUpdateResponsibleArea)
	e.DELETE("/admin/responsible-areas/:id", uc.HandleDeleteResponsibleArea)

	// AxisLevels
	e.GET("/admin/axes", uc.HandleListAxisLevels)
	e.POST("/admin/axes", uc.HandleCreateAxisLevel)
	e.GET("/admin/axes/:id", uc.HandleGetAxisLevel)
	e.PUT("/admin/axes/:id", uc.HandleUpdateAxisLevel)
	e.DELETE("/admin/axes/:id", uc.HandleDeleteAxisLevel)

	// ── Scopes & Requirements ──────────────────────────────────────
	e.GET("/scopes", uc.HandleListScopes)
	e.GET("/admin/scopes", uc.HandleListScopes)
	e.POST("/admin/scopes", uc.HandleCreateScope)
	e.PUT("/admin/scopes/:id", uc.HandleUpdateScope)
	e.DELETE("/admin/scopes/:id", uc.HandleDeleteScope)
	e.GET("/requirements", uc.HandleListRequirements)
	e.GET("/admin/requirements", uc.HandleListRequirements)
	e.POST("/admin/requirements", uc.HandleCreateRequirement)
	e.PUT("/admin/requirements/:id", uc.HandleUpdateRequirement)
	e.DELETE("/admin/requirements/:id", uc.HandleDeleteRequirement)
	e.GET("/indicators", uc.HandleListIndicators)
	e.GET("/admin/indicators", uc.HandleListIndicators)
	e.POST("/admin/indicators", uc.HandleCreateIndicator)
	e.PUT("/admin/indicators/:id", uc.HandleUpdateIndicator)
	e.DELETE("/admin/indicators/:id", uc.HandleDeleteIndicator)
	// Per-scope filter for indicators
	e.GET("/scopes/:scopeId/indicators", uc.HandleListIndicatorsByScope)

	// ── Destinations CRUD ────────────────────────────────────────────
	e.GET("/destinations", uc.HandleListDestinations)
	e.POST("/destinations", uc.HandleCreateDestination)
	e.GET("/destinations/:id", uc.HandleGetDestination)
	e.PUT("/destinations/:id", uc.HandleUpdateDestination)
	e.DELETE("/destinations/:id", uc.HandleDeleteDestination)

	// ── Evaluation CRUD ──────────────────────────────────────────────
	e.GET("/evaluations", uc.HandleListEvaluations)
	e.POST("/evaluations", uc.HandleCreateEvaluation)
	e.GET("/evaluations/:id", uc.HandleGetEvaluation)
	e.PUT("/evaluations/:id", uc.HandleUpdateEvaluation)
	e.DELETE("/evaluations/:id", uc.HandleDeleteEvaluation)

	// ── State Machine ────────────────────────────────────────────────
	e.POST("/evaluations/:id/change-status", uc.HandleChangeStatus)

	// ── Promotion ────────────────────────────────────────────────────
	e.POST("/evaluations/:id/promote", uc.HandlePromoteEvaluation)

	// ── Evaluation Access Management ─────────────────────────────────
	e.GET("/evaluations/:id/users", uc.HandleListEvaluationUsers)
	e.POST("/evaluations/:id/users", uc.HandleGrantEvaluationAccess)
	e.DELETE("/evaluations/:id/users/:userId", uc.HandleRevokeEvaluationAccess)

	// ── Actions CRUD ─────────────────────────────────────────────────
	e.GET("/actions", uc.HandleListActions)
	e.POST("/actions", uc.HandleCreateAction)
	e.GET("/actions/:id", uc.HandleGetAction)
	e.PUT("/actions/:id", uc.HandleUpdateAction)
	e.DELETE("/actions/:id", uc.HandleDeleteAction)

	// ── Action Evidence ──────────────────────────────────────────────
	e.POST("/actions/:id/evidence", uc.HandleAddActionEvidence)
	e.GET("/actions/:id/evidence", uc.HandleListActionEvidence)
	e.GET("/evidence/:id", uc.HandleGetActionEvidence)
	e.DELETE("/actions/:id/evidence/:evidenceId", uc.HandleDeleteActionEvidence)

	// ── Action Indicator Link ────────────────────────────────────────
	e.POST("/actions/:id/link-indicator", uc.HandleLinkIndicator)
	e.DELETE("/actions/:id/unlink-indicator/:indicatorId/:evaluationId", uc.HandleUnlinkIndicator)

	// ── Good Practice ────────────────────────────────────────────────
	e.PUT("/actions/:id/designate-good-practice", uc.HandleDesignateGoodPractice)
	e.PUT("/actions/:id/approve-good-practice", uc.HandleApproveGoodPractice)

	// ── DtiPlan CRUD ──────────────────────────────────────────────────
	e.GET("/dti-plans", uc.HandleListDtiPlans)
	e.POST("/dti-plans", uc.HandleCreateDtiPlan)
	e.GET("/dti-plans/:id", uc.HandleGetDtiPlan)
	e.PUT("/dti-plans/:id", uc.HandleUpdateDtiPlan)
	e.DELETE("/dti-plans/:id", uc.HandleDeleteDtiPlan)

	// ── DtiPlan Goals ─────────────────────────────────────────────────
	e.POST("/dti-plans/:id/goals", uc.HandleAddDtiPlanGoal)
	e.PUT("/dti-plans/:id/goals/:goalId", uc.HandleUpdateDtiPlanGoal)
	e.DELETE("/dti-plans/:id/goals/:goalId", uc.HandleRemoveDtiPlanGoal)
	e.GET("/dti-plans/:id/goals", uc.HandleListDtiPlanGoals)

	// ── Scope Progress ───────────────────────────────────────────────
	e.GET("/evaluations/:id/scopes", uc.HandleScopeProgress)
	e.GET("/evaluations/:id/scopes/progress", uc.HandleScopeProgress)
	e.GET("/evaluations/:evaluationId/scopes/:scopeId/indicators", uc.HandleListIndicatorsByScopeAndEval)

	// ── Phase 1e: Indicator Value Management ─────────────────────────
	// Save destination value
	e.PUT("/evaluations/:evaluationId/indicators/:id/value", uc.HandleSaveDestinationValue)
	// Get indicator value detail (with history and AI field filtering)
	e.GET("/evaluations/:evaluationId/indicators/:id", uc.HandleGetIndicatorValue)
	e.GET("/evaluations/:evaluationId/indicators/:id/value", uc.HandleGetIndicatorValue)
	// Delete destination value
	e.DELETE("/evaluations/:evaluationId/indicators/:id/value", uc.HandleDeleteDestinationValue)
	// Save evaluator value
	e.PUT("/evaluations/:evaluationId/indicators/:id/evaluator", uc.HandleSaveEvaluatorValue)
	// Save AI fields (admin/worker)
	e.PUT("/evaluations/:evaluationId/indicators/:id/ai", uc.HandleSaveAIFields)

	// ── Phase 1e: Indicator Messages ─────────────────────────────────
	e.GET("/indicators/:indicatorValueId/messages", uc.HandleListIndicatorMessages)
	e.POST("/indicators/:indicatorValueId/messages", uc.HandleCreateIndicatorMessage)

	// ── Phase 1e: AI Analysis ────────────────────────────────────────
	e.POST("/indicators/:id/analyze", uc.HandleTriggerAIAnalysis)

	// ── Notifications ─────────────────────────────────────────────────
	e.POST("/evaluations/:id/notify-destination", uc.HandleNotifyDestination)

	// ── Results ──────────────────────────────────────────────────────
	e.GET("/results", uc.HandleGetResults)

	// ── Informes ─────────────────────────────────────────────────────
	e.GET("/informes", uc.HandleListInformes)
	e.GET("/informes/:id", uc.HandleGetInforme)

	// ── Content Translation Admin ──────────────────────────────────────
	e.GET("/admin/translations/content", uc.HandleListContentTranslations)
	e.GET("/admin/translations/content/:id", uc.HandleGetContentTranslation)
	e.PUT("/admin/translations/content/:id", uc.HandleReviewContentTranslation)

	// ── Catalog Translation Admin ────────────────────────────────────────
	e.POST("/admin/translate-all", uc.HandleTranslateAll)
	e.GET("/admin/translations/catalog", uc.HandleListCatalogTranslations)
	e.PUT("/admin/translations/catalog/:id", uc.HandleReviewCatalogTranslation)

	// ── Action Translation Admin ──────────────────────────────────────────
	e.POST("/admin/translate-all-actions", uc.HandleTranslateAllActions)
}
