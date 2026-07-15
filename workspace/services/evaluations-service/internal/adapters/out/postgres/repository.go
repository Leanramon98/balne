// Repository implementation for evaluations-service.
// Provides CRUD operations for all catalog entities plus read-only queries for scopes, requirements, and indicators.
package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"evaluations-service/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/stdlib"
)

// Repository provides all database operations for the evaluations-service.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new Repository.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// InitDB initializes a database connection using pgx driver for proper UTF-8 support.
func InitDB(connString string) (*sql.DB, error) {
	// Register pgx as the postgres driver with proper UTF-8 handling
	stdlib.GetDefaultDriver()
	db, err := sql.Open("pgx", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	return db, nil
}

// ══════════════════════════════════════════════════════════════════════
// SubnationalLevel
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllSubnationalLevels(ctx context.Context) ([]*domain.SubnationalLevel, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, country, name FROM evaluations_service.subnational_level ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find all subnational levels: %w", err)
	}
	defer rows.Close()

	var items []*domain.SubnationalLevel
	for rows.Next() {
		item := &domain.SubnationalLevel{}
		if err := rows.Scan(&item.ID, &item.Country, &item.Name); err != nil {
			return nil, fmt.Errorf("scan subnational level: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindSubnationalLevelByID(ctx context.Context, id uuid.UUID) (*domain.SubnationalLevel, error) {
	item := &domain.SubnationalLevel{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, country, name FROM evaluations_service.subnational_level WHERE id = $1", id,
	).Scan(&item.ID, &item.Country, &item.Name)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateSubnationalLevel(ctx context.Context, entity *domain.SubnationalLevel) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.subnational_level (id, country, name) VALUES ($1, $2, $3)",
		entity.ID, entity.Country, entity.Name,
	)
	return err
}

func (r *Repository) UpdateSubnationalLevel(ctx context.Context, entity *domain.SubnationalLevel) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.subnational_level SET country = $1, name = $2 WHERE id = $3",
		entity.Country, entity.Name, entity.ID,
	)
	return err
}

func (r *Repository) DeleteSubnationalLevel(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.subnational_level WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// DestinationTypology
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllDestinationTypologies(ctx context.Context) ([]*domain.DestinationTypology, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name FROM evaluations_service.destination_typology ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find all typologies: %w", err)
	}
	defer rows.Close()

	var items []*domain.DestinationTypology
	for rows.Next() {
		item := &domain.DestinationTypology{}
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, fmt.Errorf("scan typology: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindDestinationTypologyByID(ctx context.Context, id uuid.UUID) (*domain.DestinationTypology, error) {
	item := &domain.DestinationTypology{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, name FROM evaluations_service.destination_typology WHERE id = $1", id,
	).Scan(&item.ID, &item.Name)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateDestinationTypology(ctx context.Context, entity *domain.DestinationTypology) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.destination_typology (id, name) VALUES ($1, $2)",
		entity.ID, entity.Name,
	)
	return err
}

func (r *Repository) UpdateDestinationTypology(ctx context.Context, entity *domain.DestinationTypology) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.destination_typology SET name = $1 WHERE id = $2",
		entity.Name, entity.ID,
	)
	return err
}

func (r *Repository) DeleteDestinationTypology(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.destination_typology WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// PopulationRange
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllPopulationRanges(ctx context.Context) ([]*domain.PopulationRange, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name FROM evaluations_service.population_range ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find all population ranges: %w", err)
	}
	defer rows.Close()

	var items []*domain.PopulationRange
	for rows.Next() {
		item := &domain.PopulationRange{}
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, fmt.Errorf("scan population range: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindPopulationRangeByID(ctx context.Context, id uuid.UUID) (*domain.PopulationRange, error) {
	item := &domain.PopulationRange{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, name FROM evaluations_service.population_range WHERE id = $1", id,
	).Scan(&item.ID, &item.Name)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreatePopulationRange(ctx context.Context, entity *domain.PopulationRange) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.population_range (id, name) VALUES ($1, $2)",
		entity.ID, entity.Name,
	)
	return err
}

func (r *Repository) UpdatePopulationRange(ctx context.Context, entity *domain.PopulationRange) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.population_range SET name = $1 WHERE id = $2",
		entity.Name, entity.ID,
	)
	return err
}

func (r *Repository) DeletePopulationRange(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.population_range WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// Region
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllRegions(ctx context.Context) ([]*domain.Region, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name, COALESCE(description, '') FROM evaluations_service.region ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find all regions: %w", err)
	}
	defer rows.Close()

	var items []*domain.Region
	for rows.Next() {
		item := &domain.Region{}
		if err := rows.Scan(&item.ID, &item.Name, &item.Description); err != nil {
			return nil, fmt.Errorf("scan region: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindRegionByID(ctx context.Context, id uuid.UUID) (*domain.Region, error) {
	item := &domain.Region{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, name, COALESCE(description, '') FROM evaluations_service.region WHERE id = $1", id,
	).Scan(&item.ID, &item.Name, &item.Description)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateRegion(ctx context.Context, entity *domain.Region) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.region (id, name, description) VALUES ($1, $2, $3)",
		entity.ID, entity.Name, entity.Description,
	)
	return err
}

func (r *Repository) UpdateRegion(ctx context.Context, entity *domain.Region) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.region SET name = $1, description = $2 WHERE id = $3",
		entity.Name, entity.Description, entity.ID,
	)
	return err
}

func (r *Repository) DeleteRegion(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.region WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// MemberType
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllMemberTypes(ctx context.Context) ([]*domain.MemberType, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name FROM evaluations_service.member_type ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find all member types: %w", err)
	}
	defer rows.Close()

	var items []*domain.MemberType
	for rows.Next() {
		item := &domain.MemberType{}
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, fmt.Errorf("scan member type: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindMemberTypeByID(ctx context.Context, id uuid.UUID) (*domain.MemberType, error) {
	item := &domain.MemberType{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, name FROM evaluations_service.member_type WHERE id = $1", id,
	).Scan(&item.ID, &item.Name)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateMemberType(ctx context.Context, entity *domain.MemberType) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.member_type (id, name) VALUES ($1, $2)",
		entity.ID, entity.Name,
	)
	return err
}

func (r *Repository) UpdateMemberType(ctx context.Context, entity *domain.MemberType) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.member_type SET name = $1 WHERE id = $2",
		entity.Name, entity.ID,
	)
	return err
}

func (r *Repository) DeleteMemberType(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.member_type WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// ResponsibleArea
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllResponsibleAreas(ctx context.Context) ([]*domain.ResponsibleArea, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name, COALESCE(description, '') FROM evaluations_service.responsible_area ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find all responsible areas: %w", err)
	}
	defer rows.Close()

	var items []*domain.ResponsibleArea
	for rows.Next() {
		item := &domain.ResponsibleArea{}
		if err := rows.Scan(&item.ID, &item.Name, &item.Description); err != nil {
			return nil, fmt.Errorf("scan responsible area: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindResponsibleAreaByID(ctx context.Context, id uuid.UUID) (*domain.ResponsibleArea, error) {
	item := &domain.ResponsibleArea{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, name, COALESCE(description, '') FROM evaluations_service.responsible_area WHERE id = $1", id,
	).Scan(&item.ID, &item.Name, &item.Description)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateResponsibleArea(ctx context.Context, entity *domain.ResponsibleArea) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.responsible_area (id, name, description) VALUES ($1, $2, $3)",
		entity.ID, entity.Name, entity.Description,
	)
	return err
}

func (r *Repository) UpdateResponsibleArea(ctx context.Context, entity *domain.ResponsibleArea) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.responsible_area SET name = $1, description = $2 WHERE id = $3",
		entity.Name, entity.Description, entity.ID,
	)
	return err
}

func (r *Repository) DeleteResponsibleArea(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.responsible_area WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// AxisLevel
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllAxisLevels(ctx context.Context) ([]*domain.AxisLevel, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, axis, objective_percent, sort_order FROM evaluations_service.axis_level ORDER BY sort_order")
	if err != nil {
		return nil, fmt.Errorf("find all axis levels: %w", err)
	}
	defer rows.Close()

	var items []*domain.AxisLevel
	for rows.Next() {
		item := &domain.AxisLevel{}
		if err := rows.Scan(&item.ID, &item.Axis, &item.ObjectivePercent, &item.SortOrder); err != nil {
			return nil, fmt.Errorf("scan axis level: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindAxisLevelByID(ctx context.Context, id uuid.UUID) (*domain.AxisLevel, error) {
	item := &domain.AxisLevel{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, axis, objective_percent, sort_order FROM evaluations_service.axis_level WHERE id = $1", id,
	).Scan(&item.ID, &item.Axis, &item.ObjectivePercent, &item.SortOrder)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateAxisLevel(ctx context.Context, entity *domain.AxisLevel) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.axis_level (id, axis, objective_percent, sort_order) VALUES ($1, $2, $3, $4)",
		entity.ID, entity.Axis, entity.ObjectivePercent, entity.SortOrder,
	)
	return err
}

func (r *Repository) UpdateAxisLevel(ctx context.Context, entity *domain.AxisLevel) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.axis_level SET axis = $1, objective_percent = $2, sort_order = $3 WHERE id = $4",
		entity.Axis, entity.ObjectivePercent, entity.SortOrder, entity.ID,
	)
	return err
}

func (r *Repository) DeleteAxisLevel(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.axis_level WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// Scope
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllScopes(ctx context.Context) ([]*domain.Scope, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT id, axis, acronym, name, COALESCE(description, ''), COALESCE(icon, ''), sort_order FROM evaluations_service.scope ORDER BY sort_order")
	if err != nil {
		return nil, fmt.Errorf("find all scopes: %w", err)
	}
	defer rows.Close()

	var items []*domain.Scope
	for rows.Next() {
		item := &domain.Scope{}
		if err := rows.Scan(&item.ID, &item.Axis, &item.Acronym, &item.Name, &item.Description, &item.Icon, &item.SortOrder); err != nil {
			return nil, fmt.Errorf("scan scope: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindScopeByID(ctx context.Context, id uuid.UUID) (*domain.Scope, error) {
	item := &domain.Scope{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, axis, acronym, name, COALESCE(description, ''), COALESCE(icon, ''), sort_order FROM evaluations_service.scope WHERE id = $1", id,
	).Scan(&item.ID, &item.Axis, &item.Acronym, &item.Name, &item.Description, &item.Icon, &item.SortOrder)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateScope(ctx context.Context, entity *domain.Scope) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.scope (id, axis, acronym, name, description, icon, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		entity.ID, entity.Axis, entity.Acronym, entity.Name, entity.Description, entity.Icon, entity.SortOrder,
	)
	return err
}

func (r *Repository) UpdateScope(ctx context.Context, entity *domain.Scope) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.scope SET axis = $1, acronym = $2, name = $3, description = $4, icon = $5, sort_order = $6 WHERE id = $7",
		entity.Axis, entity.Acronym, entity.Name, entity.Description, entity.Icon, entity.SortOrder, entity.ID,
	)
	return err
}

func (r *Repository) DeleteScope(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.scope WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// Requirement
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindAllRequirements(ctx context.Context) ([]*domain.Requirement, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT id, scope_id, code, name, COALESCE(description, '') FROM evaluations_service.requirement ORDER BY code")
	if err != nil {
		return nil, fmt.Errorf("find all requirements: %w", err)
	}
	defer rows.Close()

	var items []*domain.Requirement
	for rows.Next() {
		item := &domain.Requirement{}
		if err := rows.Scan(&item.ID, &item.ScopeID, &item.Code, &item.Name, &item.Description); err != nil {
			return nil, fmt.Errorf("scan requirement: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindRequirementByID(ctx context.Context, id uuid.UUID) (*domain.Requirement, error) {
	item := &domain.Requirement{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, scope_id, code, name, COALESCE(description, '') FROM evaluations_service.requirement WHERE id = $1", id,
	).Scan(&item.ID, &item.ScopeID, &item.Code, &item.Name, &item.Description)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateRequirement(ctx context.Context, entity *domain.Requirement) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO evaluations_service.requirement (id, scope_id, code, name, description) VALUES ($1, $2, $3, $4, $5)",
		entity.ID, entity.ScopeID, entity.Code, entity.Name, entity.Description,
	)
	return err
}

func (r *Repository) UpdateRequirement(ctx context.Context, entity *domain.Requirement) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE evaluations_service.requirement SET scope_id = $1, code = $2, name = $3, description = $4 WHERE id = $5",
		entity.ScopeID, entity.Code, entity.Name, entity.Description, entity.ID,
	)
	return err
}

func (r *Repository) DeleteRequirement(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.requirement WHERE id = $1", id,
	)
	return err
}

func (r *Repository) FindRequirementsByScope(ctx context.Context, scopeID uuid.UUID) ([]*domain.Requirement, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT id, scope_id, code, name, COALESCE(description, '') FROM evaluations_service.requirement WHERE scope_id = $1 ORDER BY code",
		scopeID,
	)
	if err != nil {
		return nil, fmt.Errorf("find requirements by scope: %w", err)
	}
	defer rows.Close()

	var items []*domain.Requirement
	for rows.Next() {
		item := &domain.Requirement{}
		if err := rows.Scan(&item.ID, &item.ScopeID, &item.Code, &item.Name, &item.Description); err != nil {
			return nil, fmt.Errorf("scan requirement: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// ══════════════════════════════════════════════════════════════════════
// Indicator
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// Indicator
// ══════════════════════════════════════════════════════════════════════

const indicatorCols = "i.id, i.requirement_id, i.code, i.name, COALESCE(i.description, ''), i.type, i.criteria, i.created_at, i.updated_at"

func (r *Repository) FindAllIndicators(ctx context.Context) ([]*domain.Indicator, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT "+indicatorCols+" FROM evaluations_service.indicator i ORDER BY i.code")
	if err != nil {
		return nil, fmt.Errorf("find all indicators: %w", err)
	}
	defer rows.Close()

	return scanIndicators(rows)
}

func (r *Repository) FindIndicatorsByRequirement(ctx context.Context, requirementID uuid.UUID) ([]*domain.Indicator, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT "+indicatorCols+" FROM evaluations_service.indicator i WHERE i.requirement_id = $1 ORDER BY i.code",
		requirementID,
	)
	if err != nil {
		return nil, fmt.Errorf("find indicators by requirement: %w", err)
	}
	defer rows.Close()

	return scanIndicators(rows)
}

func (r *Repository) FindIndicatorsByScope(ctx context.Context, scopeID uuid.UUID) ([]*domain.Indicator, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT "+indicatorCols+" FROM evaluations_service.indicator i "+
			"JOIN evaluations_service.requirement r ON r.id = i.requirement_id "+
			"WHERE r.scope_id = $1 ORDER BY i.code",
		scopeID,
	)
	if err != nil {
		return nil, fmt.Errorf("find indicators by scope: %w", err)
	}
	defer rows.Close()

	return scanIndicators(rows)
}

func (r *Repository) FindIndicatorsByScopeAndEvaluation(ctx context.Context, scopeID uuid.UUID, evaluationID uuid.UUID) ([]*domain.IndicatorWithValue, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT i.id, i.code, i.name, i.description, i.type, i.criteria,
		       i.requirement_id, r.code as requirement_code, s.axis::text,
		       iv.destination_value, iv.evaluator_value,
		       iv.destination_observations, iv.evaluator_observations,
		       iv.meta, iv.meta_date, iv.analisis_ia, iv.sugerencias_mejora_ia,
		       iv.is_verified,
		       CASE WHEN iv.id IS NOT NULL THEN true ELSE false END as is_completed,
		       COALESCE(e.has_external_evaluator, false),
		       EXISTS (
		         SELECT 1 FROM evaluations_service.action_indicator_link ail
		         JOIN evaluations_service.action_evidence ae ON ae.action_id = ail.action_id
		         WHERE ail.indicator_id = i.id AND ail.evaluation_id = $2
		       ) as has_evidence
		FROM evaluations_service.indicator i
		JOIN evaluations_service.requirement r ON r.id = i.requirement_id
		JOIN evaluations_service.scope s ON s.id = r.scope_id
		LEFT JOIN evaluations_service.indicator_value iv ON iv.indicator_id = i.id AND iv.evaluation_id = $2
		JOIN evaluations_service.evaluation e ON e.id = $2
		WHERE r.scope_id = $1
		ORDER BY i.code`, scopeID, evaluationID)
	if err != nil {
		return nil, fmt.Errorf("find indicators by scope and evaluation: %w", err)
	}
	defer rows.Close()

	var items []*domain.IndicatorWithValue
	for rows.Next() {
		item := &domain.IndicatorWithValue{}
		var criteriaBytes []byte
		var desc *string
		var isVerified sql.NullBool
		if err := rows.Scan(
			&item.ID, &item.Code, &item.Name, &desc, &item.Type, &criteriaBytes,
			&item.RequirementID, &item.RequirementCode, &item.AxisID,
			&item.DestinationValue, &item.EvaluatorValue,
			&item.DestinationObs, &item.EvaluatorObs,
			&item.Meta, &item.MetaDate, &item.AnalisisIA, &item.SugerenciasMejoraIA,
			&isVerified, &item.IsCompleted, &item.HasExternalEvaluator, &item.HasEvidence,
		); err != nil {
			return nil, fmt.Errorf("scan indicator with value: %w", err)
		}
		item.IsVerified = isVerified.Valid && isVerified.Bool
		item.Criteria = criteriaBytes
		if desc != nil && *desc != "" {
			item.Description = desc
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func scanIndicators(rows *sql.Rows) ([]*domain.Indicator, error) {
	var items []*domain.Indicator
	for rows.Next() {
		item := &domain.Indicator{}
		// criteria is JSONB — scan as bytes and parse
		var criteriaBytes []byte
		if err := rows.Scan(&item.ID, &item.RequirementID, &item.Code, &item.Name, &item.Description, &item.Type, &criteriaBytes, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan indicator: %w", err)
		}
		item.Criteria = criteriaBytes
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) CreateIndicator(ctx context.Context, entity *domain.Indicator) error {
	criteria := interface{}(entity.Criteria)
	if criteria == nil {
		criteria = []byte("[]")
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.indicator
		 (id, requirement_id, code, name, description, type, criteria, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
		entity.ID, entity.RequirementID, entity.Code, entity.Name, entity.Description, entity.Type, criteria,
	)
	return err
}

func (r *Repository) UpdateIndicator(ctx context.Context, entity *domain.Indicator) error {
	criteria := interface{}(entity.Criteria)
	if criteria == nil {
		criteria = []byte("[]")
	}
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.indicator
		 SET requirement_id=$1, code=$2, name=$3, description=$4, type=$5, criteria=$6, updated_at=NOW()
		 WHERE id=$7`,
		entity.RequirementID, entity.Code, entity.Name, entity.Description, entity.Type, criteria, entity.ID,
	)
	return err
}

func (r *Repository) DeleteIndicator(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.indicator WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// Destination CRUD
// ══════════════════════════════════════════════════════════════════════

const destinationCols = "id, name, country, subnational_level_id, typology_id, population_range_id, region_id, member_type_id, lat, lng, is_adhered, created_at, updated_at"

func (r *Repository) CreateDestination(ctx context.Context, d *domain.Destination) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.destination (`+destinationCols+`)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		d.ID, d.Name, d.Country, d.SubnationalLevelID, d.TypologyID,
		d.PopulationRangeID, d.RegionID, d.MemberTypeID, d.Lat, d.Lng,
		d.IsAdhered, d.CreatedAt, d.UpdatedAt,
	)
	return err
}

func (r *Repository) FindDestinationByID(ctx context.Context, id uuid.UUID) (*domain.Destination, error) {
	d := &domain.Destination{}
	err := r.db.QueryRowContext(ctx,
		"SELECT "+destinationCols+" FROM evaluations_service.destination WHERE id = $1", id,
	).Scan(&d.ID, &d.Name, &d.Country, &d.SubnationalLevelID, &d.TypologyID,
		&d.PopulationRangeID, &d.RegionID, &d.MemberTypeID, &d.Lat, &d.Lng,
		&d.IsAdhered, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (r *Repository) FindDestinations(ctx context.Context) ([]*domain.Destination, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT "+destinationCols+" FROM evaluations_service.destination ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("find destinations: %w", err)
	}
	defer rows.Close()

	var items []*domain.Destination
	for rows.Next() {
		d := &domain.Destination{}
		if err := rows.Scan(&d.ID, &d.Name, &d.Country, &d.SubnationalLevelID, &d.TypologyID,
			&d.PopulationRangeID, &d.RegionID, &d.MemberTypeID, &d.Lat, &d.Lng,
			&d.IsAdhered, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan destination: %w", err)
		}
		items = append(items, d)
	}
	return items, rows.Err()
}

func (r *Repository) UpdateDestination(ctx context.Context, d *domain.Destination) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.destination
		 SET name=$1, country=$2, subnational_level_id=$3, typology_id=$4,
		     population_range_id=$5, region_id=$6, member_type_id=$7,
		     lat=$8, lng=$9, is_adhered=$10, updated_at=$11
		 WHERE id=$12`,
		d.Name, d.Country, d.SubnationalLevelID, d.TypologyID,
		d.PopulationRangeID, d.RegionID, d.MemberTypeID,
		d.Lat, d.Lng, d.IsAdhered, d.UpdatedAt, d.ID,
	)
	return err
}

func (r *Repository) DeleteDestination(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.destination WHERE id = $1", id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// Evaluation CRUD
// ══════════════════════════════════════════════════════════════════════

const evaluationCols = "id, destination_id, name, type, status, start_date, end_date, has_external_evaluator, promoted_from_id, created_by, created_at, updated_at"

// evaluationSelCols includes a LEFT JOIN to fetch created_by_name from users_service.
const evaluationSelCols = "e.id, e.destination_id, e.name, e.type, e.status, e.start_date, e.end_date, e.has_external_evaluator, e.promoted_from_id, e.created_by, e.created_at, e.updated_at, COALESCE(u.fullname, '') AS created_by_name"

func (r *Repository) CreateEvaluation(ctx context.Context, e *domain.Evaluation) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.evaluation (`+evaluationCols+`)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		e.ID, e.DestinationID, e.Name, e.Type, e.Status,
		e.StartDate, e.EndDate, e.HasExternalEvaluator,
		e.PromotedFromID, e.CreatedBy, e.CreatedAt, e.UpdatedAt,
	)
	return err
}

func (r *Repository) FindEvaluationByID(ctx context.Context, id uuid.UUID) (*domain.Evaluation, error) {
	e := &domain.Evaluation{}
	err := r.db.QueryRowContext(ctx,
		"SELECT "+evaluationSelCols+" FROM evaluations_service.evaluation e LEFT JOIN users_service.user u ON u.id = e.created_by WHERE e.id = $1", id,
	).Scan(&e.ID, &e.DestinationID, &e.Name, &e.Type, &e.Status,
		&e.StartDate, &e.EndDate, &e.HasExternalEvaluator,
		&e.PromotedFromID, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt, &e.CreatedByName)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *Repository) FindEvaluations(ctx context.Context, destinationID, evalType, status string, limit, offset int) ([]*domain.Evaluation, error) {
	query := "SELECT " + evaluationSelCols + " FROM evaluations_service.evaluation e LEFT JOIN users_service.user u ON u.id = e.created_by WHERE 1=1"
	var args []interface{}
	argIdx := 1

	if destinationID != "" {
		query += fmt.Sprintf(" AND e.destination_id = $%d", argIdx)
		args = append(args, destinationID)
		argIdx++
	}
	if evalType != "" {
		query += fmt.Sprintf(" AND e.type = $%d", argIdx)
		args = append(args, evalType)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND e.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	query += " ORDER BY e.created_at DESC"

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("find evaluations: %w", err)
	}
	defer rows.Close()

	return scanEvaluations(rows)
}

func (r *Repository) CountEvaluations(ctx context.Context, destinationID, evalType, status string) (int, error) {
	query := "SELECT COUNT(*) FROM evaluations_service.evaluation WHERE 1=1"
	var args []interface{}
	argIdx := 1

	if destinationID != "" {
		query += fmt.Sprintf(" AND destination_id = $%d", argIdx)
		args = append(args, destinationID)
		argIdx++
	}
	if evalType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, evalType)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	var count int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return 0, fmt.Errorf("count evaluations: %w", err)
	}
	return count, nil
}

func (r *Repository) UpdateEvaluation(ctx context.Context, e *domain.Evaluation) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.evaluation
		 SET name=$1, type=$2, status=$3, start_date=$4, end_date=$5,
		     has_external_evaluator=$6, promoted_from_id=$7, updated_at=$8
		 WHERE id=$9`,
		e.Name, e.Type, e.Status, e.StartDate, e.EndDate,
		e.HasExternalEvaluator, e.PromotedFromID, e.UpdatedAt, e.ID,
	)
	return err
}

func (r *Repository) DeleteEvaluation(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. indicator_message → references indicator_value (no cascade)
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM evaluations_service.indicator_message
		 WHERE indicator_value_id IN (
		   SELECT id FROM evaluations_service.indicator_value WHERE evaluation_id = $1
		 )`, id,
	); err != nil {
		return fmt.Errorf("delete indicator_messages: %w", err)
	}

	// 2. indicator_history → references indicator_value (no cascade) + evaluation (no cascade)
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM evaluations_service.indicator_history
		 WHERE indicator_value_id IN (
		   SELECT id FROM evaluations_service.indicator_value WHERE evaluation_id = $1
		 ) OR previous_evaluation_id = $1`, id,
	); err != nil {
		return fmt.Errorf("delete indicator_history: %w", err)
	}

	// 3. action_evidence → references evaluation (no cascade)
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM evaluations_service.action_evidence WHERE evaluation_id = $1`, id,
	); err != nil {
		return fmt.Errorf("delete action_evidence: %w", err)
	}

	// 4. action_indicator_link → references evaluation (no cascade)
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM evaluations_service.action_indicator_link WHERE evaluation_id = $1`, id,
	); err != nil {
		return fmt.Errorf("delete action_indicator_link: %w", err)
	}

	// 5. indicator_value → has ON DELETE CASCADE from evaluation, but delete explicitly for safety
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM evaluations_service.indicator_value WHERE evaluation_id = $1`, id,
	); err != nil {
		return fmt.Errorf("delete indicator_values: %w", err)
	}

	// 6. evaluation_user → has ON DELETE CASCADE, but once evaluation is gone, that's covered
	// 7. evaluation itself
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM evaluations_service.evaluation WHERE id = $1`, id,
	); err != nil {
		return fmt.Errorf("delete evaluation: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

func scanEvaluations(rows *sql.Rows) ([]*domain.Evaluation, error) {
	var items []*domain.Evaluation
	for rows.Next() {
		e := &domain.Evaluation{}
		if err := rows.Scan(&e.ID, &e.DestinationID, &e.Name, &e.Type, &e.Status,
			&e.StartDate, &e.EndDate, &e.HasExternalEvaluator,
			&e.PromotedFromID, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt, &e.CreatedByName); err != nil {
			return nil, fmt.Errorf("scan evaluation: %w", err)
		}
		items = append(items, e)
	}
	return items, rows.Err()
}

// ══════════════════════════════════════════════════════════════════════
// Role-based scoping queries
// ══════════════════════════════════════════════════════════════════════

// FindDestinationsByRegionID returns destinations in a given region.
func (r *Repository) FindDestinationsByRegionID(ctx context.Context, regionID string) ([]*domain.Destination, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT id, name FROM evaluations_service.destination WHERE region_id = $1::uuid ORDER BY name", regionID)
	if err != nil {
		return nil, fmt.Errorf("find destinations by region: %w", err)
	}
	defer rows.Close()

	var items []*domain.Destination
	for rows.Next() {
		d := &domain.Destination{}
		if err := rows.Scan(&d.ID, &d.Name); err != nil {
			return nil, fmt.Errorf("scan destination: %w", err)
		}
		items = append(items, d)
	}
	return items, rows.Err()
}

// FindEvaluationsByDestinationIDs returns evaluations matching any of the given destination IDs,
// with optional type/status filters and pagination. Returns total count via COUNT(*) OVER().
func (r *Repository) FindEvaluationsByDestinationIDs(ctx context.Context, destIDs []uuid.UUID, evalType, status string, limit, offset int) ([]*domain.Evaluation, int, error) {
	if len(destIDs) == 0 {
		return nil, 0, nil
	}

	query := "SELECT " + evaluationSelCols + ", COUNT(*) OVER() AS total_count" +
		" FROM evaluations_service.evaluation e" +
		" LEFT JOIN users_service.user u ON u.id = e.created_by" +
		" WHERE e.destination_id = ANY($1::uuid[])" +
		" AND ($2 = '' OR e.type = $2)" +
		" AND ($3 = '' OR e.status = $3)" +
		" ORDER BY e.created_at DESC" +
		" LIMIT $4 OFFSET $5"

	rows, err := r.db.QueryContext(ctx, query, destIDs, evalType, status, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("find evaluations by destination ids: %w", err)
	}
	defer rows.Close()

	var items []*domain.Evaluation
	var total int
	for rows.Next() {
		e := &domain.Evaluation{}
		if err := rows.Scan(&e.ID, &e.DestinationID, &e.Name, &e.Type, &e.Status,
			&e.StartDate, &e.EndDate, &e.HasExternalEvaluator,
			&e.PromotedFromID, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt, &e.CreatedByName, &total); err != nil {
			return nil, 0, fmt.Errorf("scan evaluation: %w", err)
		}
		items = append(items, e)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// FindEvaluationsByUserID returns evaluations where the user has an explicit access entry
// in evaluation_user, filtered by evaluation types and optional status.
func (r *Repository) FindEvaluationsByUserID(ctx context.Context, userID string, evalTypes []string, status string, limit, offset int) ([]*domain.Evaluation, int, error) {
	query := "SELECT " + evaluationSelCols + ", COUNT(*) OVER() AS total_count" +
		" FROM evaluations_service.evaluation e" +
		" LEFT JOIN users_service.user u ON u.id = e.created_by" +
		" JOIN evaluations_service.evaluation_user eu ON e.id = eu.evaluation_id" +
		" WHERE eu.user_id = $1::uuid" +
		" AND e.type = ANY($2::text[])" +
		" AND ($3 = '' OR e.status = $3)" +
		" ORDER BY e.created_at DESC" +
		" LIMIT $4 OFFSET $5"

	rows, err := r.db.QueryContext(ctx, query, userID, evalTypes, status, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("find evaluations by user id: %w", err)
	}
	defer rows.Close()

	var items []*domain.Evaluation
	var total int
	for rows.Next() {
		e := &domain.Evaluation{}
		if err := rows.Scan(&e.ID, &e.DestinationID, &e.Name, &e.Type, &e.Status,
			&e.StartDate, &e.EndDate, &e.HasExternalEvaluator,
			&e.PromotedFromID, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt, &e.CreatedByName, &total); err != nil {
			return nil, 0, fmt.Errorf("scan evaluation: %w", err)
		}
		items = append(items, e)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// ══════════════════════════════════════════════════════════════════════
// EvaluationUser (Access Management)
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) GrantAccess(ctx context.Context, evaluationID, userID uuid.UUID, level domain.AccessLevel) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.evaluation_user (evaluation_id, user_id, access_level)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (evaluation_id, user_id) DO UPDATE SET access_level = $3`,
		evaluationID, userID, level,
	)
	return err
}

func (r *Repository) RevokeAccess(ctx context.Context, evaluationID, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.evaluation_user WHERE evaluation_id = $1 AND user_id = $2",
		evaluationID, userID,
	)
	return err
}

func (r *Repository) ListAccess(ctx context.Context, evaluationID uuid.UUID) ([]*domain.EvaluationUser, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT evaluation_id, user_id, access_level FROM evaluations_service.evaluation_user WHERE evaluation_id = $1 ORDER BY user_id",
		evaluationID,
	)
	if err != nil {
		return nil, fmt.Errorf("list access: %w", err)
	}
	defer rows.Close()

	var items []*domain.EvaluationUser
	for rows.Next() {
		item := &domain.EvaluationUser{}
		if err := rows.Scan(&item.EvaluationID, &item.UserID, &item.AccessLevel); err != nil {
			return nil, fmt.Errorf("scan evaluation_user: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetUserAccessLevel(ctx context.Context, evaluationID, userID uuid.UUID) (domain.AccessLevel, error) {
	var level domain.AccessLevel
	err := r.db.QueryRowContext(ctx,
		"SELECT access_level FROM evaluations_service.evaluation_user WHERE evaluation_id = $1 AND user_id = $2",
		evaluationID, userID,
	).Scan(&level)
	return level, err
}

// ══════════════════════════════════════════════════════════════════════
// Scope Progress
// ══════════════════════════════════════════════════════════════════════

// GetScopeProgress returns progress per scope for a given evaluation.
func (r *Repository) GetScopeProgress(ctx context.Context, evaluationID uuid.UUID) ([]*domain.ScopeProgress, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT
			s.id::text AS scope_id,
			s.name AS scope_name,
			s.acronym AS scope_acronym,
			COALESCE(s.icon, '') AS scope_icon,
			COALESCE(s.description, '') AS scope_description,
			COUNT(i.id) AS total_indicators,
			COUNT(CASE WHEN iv.destination_value IS NOT NULL THEN 1 END) AS completed_indicators
		FROM evaluations_service.scope s
		JOIN evaluations_service.requirement r ON r.scope_id = s.id
		JOIN evaluations_service.indicator i ON i.requirement_id = r.id
		LEFT JOIN evaluations_service.indicator_value iv ON iv.indicator_id = i.id AND iv.evaluation_id = $1
		GROUP BY s.id, s.name, s.acronym, s.icon, s.description, s.sort_order
		ORDER BY s.sort_order`,
		evaluationID,
	)
	if err != nil {
		return nil, fmt.Errorf("get scope progress: %w", err)
	}
	defer rows.Close()

	return scanScopeProgress(rows)
}

func scanScopeProgress(rows *sql.Rows) ([]*domain.ScopeProgress, error) {
	var items []*domain.ScopeProgress
	for rows.Next() {
		p := &domain.ScopeProgress{}
		var total, completed int
		if err := rows.Scan(&p.ScopeID, &p.ScopeName, &p.ScopeAcronym, &p.ScopeIcon, &p.ScopeDescription,
			&total, &completed); err != nil {
			return nil, fmt.Errorf("scan scope progress: %w", err)
		}
		p.TotalIndicators = total
		p.CompletedIndicators = completed
		if total > 0 {
			p.CompletionPercent = float64(completed) / float64(total) * 100.0
		}
		p.Percentage = p.CompletionPercent
		switch {
		case p.CompletionPercent >= 100:
			p.Status = "green"
		case p.CompletionPercent > 0:
			p.Status = "orange"
		default:
			p.Status = "empty"
		}
		items = append(items, p)
	}
	return items, rows.Err()
}

// ══════════════════════════════════════════════════════════════════════
// Action CRUD
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateAction(ctx context.Context, a *domain.Action) error {
	var axes, scopes, ods interface{}
	if a.Axes != nil {
		axes = string(a.Axes)
	}
	if a.Scopes != nil {
		scopes = string(a.Scopes)
	}
	if a.ODS != nil {
		ods = string(a.ODS)
	}

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.action
		 (id, destination_id, name, summary, objective, status, axes, scopes,
		  extended_description, complexity, horizon, start_date, end_date,
		  responsible_person, responsible_area_id, actors, ods,
		  budget_amount, budget_currency, budget_executed, budget_source,
		  photo_url, website_url, awards, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
		a.ID, a.DestinationID, a.Name, a.Summary, a.Objective, a.Status,
		axes, scopes, a.ExtendedDescription, a.Complexity, a.Horizon,
		a.StartDate, a.EndDate, a.ResponsiblePerson, a.ResponsibleAreaID,
		a.ActorReferences, ods, a.BudgetAmount, a.BudgetCurrency,
		a.BudgetExecuted, a.BudgetSource, a.PhotoURL, a.WebsiteURL,
		a.Awards, a.CreatedAt, a.UpdatedAt,
	)
	return err
}

func (r *Repository) FindActionByID(ctx context.Context, id uuid.UUID) (*domain.Action, error) {
	a := &domain.Action{}
	var axes, scopes, ods []byte
	err := r.db.QueryRowContext(ctx,
		`SELECT id, destination_id, name, summary, objective, status, axes, scopes,
		        extended_description, complexity, horizon, start_date, end_date,
		        responsible_person, responsible_area_id, actors, ods,
		        budget_amount, budget_currency, budget_executed, budget_source,
		        photo_url, website_url, awards, created_at, updated_at
		 FROM evaluations_service.action WHERE id = $1`, id,
	).Scan(&a.ID, &a.DestinationID, &a.Name, &a.Summary, &a.Objective, &a.Status,
		&axes, &scopes, &a.ExtendedDescription, &a.Complexity, &a.Horizon,
		&a.StartDate, &a.EndDate, &a.ResponsiblePerson, &a.ResponsibleAreaID,
		&a.ActorReferences, &ods, &a.BudgetAmount, &a.BudgetCurrency,
		&a.BudgetExecuted, &a.BudgetSource, &a.PhotoURL, &a.WebsiteURL,
		&a.Awards, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if axes != nil {
		a.Axes = json.RawMessage(axes)
	}
	if scopes != nil {
		a.Scopes = json.RawMessage(scopes)
	}
	if ods != nil {
		a.ODS = json.RawMessage(ods)
	}
	return a, nil
}

func (r *Repository) FindAllActions(ctx context.Context) ([]*domain.Action, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, destination_id, name, summary, objective, status, axes, scopes,
		        extended_description, complexity, horizon, start_date, end_date,
		        responsible_person, responsible_area_id, actors, ods,
		        budget_amount, budget_currency, budget_executed, budget_source,
		        photo_url, website_url, awards, created_at, updated_at
		 FROM evaluations_service.action ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("find all actions: %w", err)
	}
	defer rows.Close()
	return scanActions(rows)
}

func (r *Repository) FindActionsByDestination(ctx context.Context, destinationID uuid.UUID) ([]*domain.Action, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, destination_id, name, summary, objective, status, axes, scopes,
		        extended_description, complexity, horizon, start_date, end_date,
		        responsible_person, responsible_area_id, actors, ods,
		        budget_amount, budget_currency, budget_executed, budget_source,
		        photo_url, website_url, awards, created_at, updated_at
		 FROM evaluations_service.action WHERE destination_id = $1 ORDER BY created_at DESC`,
		destinationID,
	)
	if err != nil {
		return nil, fmt.Errorf("find actions by destination: %w", err)
	}
	defer rows.Close()
	actions, err := scanActions(rows)
	if err != nil {
		return nil, err
	}
	return r.populateLinkedIndicators(ctx, actions)
}

func (r *Repository) FindActionsByScope(ctx context.Context, scopeID uuid.UUID) ([]*domain.Action, error) {
	scopeJSON := fmt.Sprintf(`["%s"]`, scopeID.String())
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, destination_id, name, summary, objective, status, axes, scopes,
		        extended_description, complexity, horizon, start_date, end_date,
		        responsible_person, responsible_area_id, actors, ods,
		        budget_amount, budget_currency, budget_executed, budget_source,
		        photo_url, website_url, awards, created_at, updated_at
		 FROM evaluations_service.action WHERE scopes @> $1::jsonb ORDER BY created_at DESC`,
		scopeJSON,
	)
	if err != nil {
		return nil, fmt.Errorf("find actions by scope: %w", err)
	}
	defer rows.Close()
	return scanActions(rows)
}

func (r *Repository) UpdateAction(ctx context.Context, a *domain.Action) error {
	var axes, scopes, ods interface{}
	if a.Axes != nil {
		axes = string(a.Axes)
	}
	if a.Scopes != nil {
		scopes = string(a.Scopes)
	}
	if a.ODS != nil {
		ods = string(a.ODS)
	}

	log.Printf("[UpdateAction] REPO name=%s status=%s axes=%v scopes=%v budget_currency=%s responsible_area_id=%v",
		a.Name, a.Status, axes, scopes, a.BudgetCurrency, a.ResponsibleAreaID)

	result, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.action
		 SET name=$1, summary=$2, objective=$3, status=$4, axes=$5, scopes=$6,
		     extended_description=$7, complexity=$8, horizon=$9,
		     start_date=$10, end_date=$11,
		     responsible_person=$12, responsible_area_id=$13, actors=$14, ods=$15,
		     budget_amount=$16, budget_currency=$17, budget_executed=$18, budget_source=$19,
		     photo_url=$20, website_url=$21, awards=$22,
		     updated_at=NOW()
		 WHERE id=$23`,
		a.Name, a.Summary, a.Objective, a.Status, axes, scopes,
		a.ExtendedDescription, a.Complexity, a.Horizon,
		a.StartDate, a.EndDate,
		a.ResponsiblePerson, a.ResponsibleAreaID, a.ActorReferences, ods,
		a.BudgetAmount, a.BudgetCurrency, a.BudgetExecuted, a.BudgetSource,
		a.PhotoURL, a.WebsiteURL, a.Awards,
		a.ID,
	)
	if err != nil {
		log.Printf("[UpdateAction] REPO ERROR: %v", err)
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	log.Printf("[UpdateAction] REPO SUCCESS rows_affected=%d", rowsAffected)
	return nil
}

func (r *Repository) DeleteAction(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.action WHERE id = $1", id,
	)
	return err
}

func scanActions(rows *sql.Rows) ([]*domain.Action, error) {
	var items []*domain.Action
	for rows.Next() {
		a := &domain.Action{}
		var axes, scopes, ods []byte
		if err := rows.Scan(&a.ID, &a.DestinationID, &a.Name, &a.Summary, &a.Objective, &a.Status,
			&axes, &scopes, &a.ExtendedDescription, &a.Complexity, &a.Horizon,
			&a.StartDate, &a.EndDate, &a.ResponsiblePerson, &a.ResponsibleAreaID,
			&a.ActorReferences, &ods, &a.BudgetAmount, &a.BudgetCurrency,
			&a.BudgetExecuted, &a.BudgetSource, &a.PhotoURL, &a.WebsiteURL,
			&a.Awards, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan action: %w", err)
		}
		if axes != nil {
			a.Axes = json.RawMessage(axes)
		}
		if scopes != nil {
			a.Scopes = json.RawMessage(scopes)
		}
		if ods != nil {
			a.ODS = json.RawMessage(ods)
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

func (r *Repository) populateLinkedIndicators(ctx context.Context, actions []*domain.Action) ([]*domain.Action, error) {
	if len(actions) == 0 {
		return actions, nil
	}
	// Build placeholders $1,$2,...
	placeholders := make([]string, len(actions))
	args := make([]interface{}, len(actions))
	for i, a := range actions {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = a.ID
	}
	query := fmt.Sprintf(
		`SELECT id, action_id, indicator_id, evaluation_id, action_status_at_link, created_at
		 FROM evaluations_service.action_indicator_link
		 WHERE action_id IN (%s)
		 ORDER BY created_at`,
		strings.Join(placeholders, ","),
	)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("fetch linked indicators: %w", err)
	}
	defer rows.Close()

	// Group links by action_id
	linksByAction := make(map[uuid.UUID][]domain.ActionIndicatorLink)
	for rows.Next() {
		var link domain.ActionIndicatorLink
		if err := rows.Scan(&link.ID, &link.ActionID, &link.IndicatorID, &link.EvaluationID, &link.ActionStatusAtLink, &link.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan action indicator link: %w", err)
		}
		linksByAction[link.ActionID] = append(linksByAction[link.ActionID], link)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Populate LinkedIndicators on each action
	for _, a := range actions {
		if links, ok := linksByAction[a.ID]; ok {
			a.LinkedIndicators = links
		}
	}
	return actions, nil
}

// ══════════════════════════════════════════════════════════════════════
// ActionEvidence
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateActionEvidence(ctx context.Context, e *domain.ActionEvidence) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.action_evidence (id, action_id, evaluation_id, type, url, file_path, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
		e.ID, e.ActionID, e.EvaluationID, e.Type, e.URL, e.FilePath,
	)
	return err
}

func (r *Repository) ListActionEvidence(ctx context.Context, actionID uuid.UUID) ([]*domain.ActionEvidence, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, action_id, evaluation_id, type, url, file_path, created_at
		 FROM evaluations_service.action_evidence WHERE action_id = $1 ORDER BY created_at DESC`,
		actionID,
	)
	if err != nil {
		return nil, fmt.Errorf("list action evidence: %w", err)
	}
	defer rows.Close()

	var items []*domain.ActionEvidence
	for rows.Next() {
		e := &domain.ActionEvidence{}
		if err := rows.Scan(&e.ID, &e.ActionID, &e.EvaluationID, &e.Type, &e.URL, &e.FilePath, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan action evidence: %w", err)
		}
		items = append(items, e)
	}
	return items, rows.Err()
}

func (r *Repository) CountActionEvidence(ctx context.Context, actionID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM evaluations_service.action_evidence WHERE action_id = $1", actionID,
	).Scan(&count)
	return count, err
}

func (r *Repository) DeleteActionEvidence(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM evaluations_service.action_evidence WHERE id = $1`, id,
	)
	return err
}

func (r *Repository) FindActionEvidenceByID(ctx context.Context, id uuid.UUID) (*domain.ActionEvidence, error) {
	e := &domain.ActionEvidence{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, action_id, evaluation_id, type, url, file_path, created_at
		 FROM evaluations_service.action_evidence WHERE id = $1`, id,
	).Scan(&e.ID, &e.ActionID, &e.EvaluationID, &e.Type, &e.URL, &e.FilePath, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}

// ══════════════════════════════════════════════════════════════════════
// ActionIndicatorLink
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateActionIndicatorLink(ctx context.Context, l *domain.ActionIndicatorLink) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.action_indicator_link
		 (id, action_id, indicator_id, evaluation_id, action_status_at_link, created_at)
		 VALUES ($1,$2,$3,$4,$5,NOW())`,
		l.ID, l.ActionID, l.IndicatorID, l.EvaluationID, l.ActionStatusAtLink,
	)
	return err
}

func (r *Repository) DeleteActionIndicatorLink(ctx context.Context, actionID, indicatorID, evaluationID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM evaluations_service.action_indicator_link
		 WHERE action_id = $1 AND indicator_id = $2 AND evaluation_id = $3`,
		actionID, indicatorID, evaluationID,
	)
	return err
}

func (r *Repository) ListActionIndicatorLinks(ctx context.Context, actionID uuid.UUID) ([]*domain.ActionIndicatorLink, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, action_id, indicator_id, evaluation_id, action_status_at_link, created_at
		 FROM evaluations_service.action_indicator_link WHERE action_id = $1 ORDER BY created_at`,
		actionID,
	)
	if err != nil {
		return nil, fmt.Errorf("list action indicator links: %w", err)
	}
	defer rows.Close()

	var items []*domain.ActionIndicatorLink
	for rows.Next() {
		l := &domain.ActionIndicatorLink{}
		if err := rows.Scan(&l.ID, &l.ActionID, &l.IndicatorID, &l.EvaluationID, &l.ActionStatusAtLink, &l.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan action indicator link: %w", err)
		}
		items = append(items, l)
	}
	return items, rows.Err()
}

// ══════════════════════════════════════════════════════════════════════
// GoodPractice
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateGoodPractice(ctx context.Context, gp *domain.GoodPractice) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.good_practice
		 (id, action_id, designated_by, designated_at, approved_by, approved_at, status)
		 VALUES ($1,$2,$3,NOW(),$4,$5,$6)`,
		gp.ID, gp.ActionID, gp.DesignatedBy, gp.ApprovedBy, gp.ApprovedAt, gp.Status,
	)
	return err
}

func (r *Repository) FindGoodPracticeByActionID(ctx context.Context, actionID uuid.UUID) (*domain.GoodPractice, error) {
	gp := &domain.GoodPractice{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, action_id, designated_by, designated_at, approved_by, approved_at, status
		 FROM evaluations_service.good_practice WHERE action_id = $1`, actionID,
	).Scan(&gp.ID, &gp.ActionID, &gp.DesignatedBy, &gp.DesignatedAt, &gp.ApprovedBy, &gp.ApprovedAt, &gp.Status)
	if err != nil {
		return nil, err
	}
	return gp, nil
}

func (r *Repository) UpdateGoodPractice(ctx context.Context, gp *domain.GoodPractice) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.good_practice
		 SET approved_by=$1, approved_at=$2, status=$3
		 WHERE id=$4`,
		gp.ApprovedBy, gp.ApprovedAt, gp.Status, gp.ID,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// Promotion — Deep copy helpers (used within a single transaction)
// ══════════════════════════════════════════════════════════════════════

// CreateEvaluationTx creates an evaluation within an existing transaction.
func (r *Repository) CreateEvaluationTx(tx *sql.Tx, e *domain.Evaluation) error {
	_, err := tx.Exec(
		`INSERT INTO evaluations_service.evaluation (`+evaluationCols+`)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		e.ID, e.DestinationID, e.Name, e.Type, e.Status,
		e.StartDate, e.EndDate, e.HasExternalEvaluator,
		e.PromotedFromID, e.CreatedBy, e.CreatedAt, e.UpdatedAt,
	)
	return err
}

// CopyIndicatorValuesTx copies indicator values from source eval to new eval
// within a transaction. Returns a map of source indicator_id → new indicator_value_id.
func (r *Repository) CopyIndicatorValuesTx(tx *sql.Tx, sourceEvalID, newEvalID uuid.UUID) (map[uuid.UUID]uuid.UUID, error) {
	rows, err := tx.Query(
		`SELECT id, indicator_id, destination_value, evaluator_value, meta, meta_date,
		        destination_observations, evaluator_observations, is_editing_enabled
		 FROM evaluations_service.indicator_value
		 WHERE evaluation_id = $1`,
		sourceEvalID,
	)
	if err != nil {
		return nil, fmt.Errorf("query source indicator values: %w", err)
	}
	defer rows.Close()

	type sourceRow struct {
		ID                      uuid.UUID
		IndicatorID             uuid.UUID
		DestinationValue        *int
		EvaluatorValue          *int
		Meta                    *int
		MetaDate                *time.Time
		DestinationObservations *string
		EvaluatorObservations   *string
		IsEditingEnabled        bool
	}

	var sources []sourceRow
	for rows.Next() {
		var s sourceRow
		if err := rows.Scan(&s.ID, &s.IndicatorID, &s.DestinationValue, &s.EvaluatorValue,
			&s.Meta, &s.MetaDate, &s.DestinationObservations, &s.EvaluatorObservations,
			&s.IsEditingEnabled); err != nil {
			return nil, fmt.Errorf("scan source indicator value: %w", err)
		}
		sources = append(sources, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	mapping := make(map[uuid.UUID]uuid.UUID, len(sources))
	for _, s := range sources {
		newIVID := uuid.New()
		_, err := tx.Exec(
			`INSERT INTO evaluations_service.indicator_value
			 (id, indicator_id, evaluation_id, destination_value, evaluator_value,
			  meta, meta_date, destination_observations, evaluator_observations,
			  is_verified, is_editing_enabled, created_at, updated_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10,NOW(),NOW())`,
			newIVID, s.IndicatorID, newEvalID,
			s.DestinationValue, s.EvaluatorValue,
			s.Meta, s.MetaDate, s.DestinationObservations, s.EvaluatorObservations,
			s.IsEditingEnabled,
		)
		if err != nil {
			return nil, fmt.Errorf("copy indicator value %s: %w", s.IndicatorID, err)
		}
		mapping[s.IndicatorID] = newIVID
	}

	return mapping, nil
}

// CreateIndicatorHistoryTx creates history entries for promoted indicator values.
func (r *Repository) CreateIndicatorHistoryTx(tx *sql.Tx, sourceEvalID uuid.UUID, newIVID uuid.UUID, prevIndicatorValueID uuid.UUID) error {
	// Read source indicator value data
	var destVal, evalVal *int
	var obs *string
	err := tx.QueryRow(
		`SELECT destination_value, evaluator_value, destination_observations
		 FROM evaluations_service.indicator_value WHERE id = $1`,
		prevIndicatorValueID,
	).Scan(&destVal, &evalVal, &obs)
	if err != nil {
		return fmt.Errorf("read source indicator value for history: %w", err)
	}

	_, err = tx.Exec(
		`INSERT INTO evaluations_service.indicator_history
		 (id, indicator_value_id, previous_evaluation_id, destination_value, evaluator_value, observations, source, created_at, modified_by)
		 VALUES ($1,$2,$3,$4,$5,$6,'promotion',NOW(),'')`,
		uuid.New(), newIVID, sourceEvalID, destVal, evalVal, obs,
	)
	return err
}

// GetSourceIndicatorValueIDs returns id and indicator_id for all indicator values in an evaluation.
func (r *Repository) GetSourceIndicatorValueIDs(ctx context.Context, evaluationID uuid.UUID) ([]domain.SourceIndicatorRow, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT id, indicator_id FROM evaluations_service.indicator_value WHERE evaluation_id = $1",
		evaluationID,
	)
	if err != nil {
		return nil, fmt.Errorf("get source indicator value ids: %w", err)
	}
	defer rows.Close()

	var items []domain.SourceIndicatorRow
	for rows.Next() {
		var s domain.SourceIndicatorRow
		if err := rows.Scan(&s.ID, &s.IndicatorID); err != nil {
			return nil, fmt.Errorf("scan source indicator value id: %w", err)
		}
		items = append(items, s)
	}
	return items, rows.Err()
}

// CopyActionIndicatorLinksTx copies action→indicator links with current action status snapshot.
func (r *Repository) CopyActionIndicatorLinksTx(tx *sql.Tx, sourceEvalID, newEvalID uuid.UUID) error {
	_, err := tx.Exec(
		`INSERT INTO evaluations_service.action_indicator_link
		 (id, action_id, indicator_id, evaluation_id, action_status_at_link, created_at)
		 SELECT uuid_generate_v4(), ail.action_id, ail.indicator_id, $2::uuid,
		        a.status, NOW()
		 FROM evaluations_service.action_indicator_link ail
		 JOIN evaluations_service.action a ON a.id = ail.action_id
		 WHERE ail.evaluation_id = $1`,
		sourceEvalID, newEvalID,
	)
	return err
}

// BeginTx starts a new transaction.
func (r *Repository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, nil)
}

// ══════════════════════════════════════════════════════════════════════
// Helper: build a query with the evaluations_service schema prefix
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// DtiPlan CRUD (stubs - will be implemented in Phase 1d)
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateDtiPlan(ctx context.Context, p *domain.DtiPlan) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.dti_plan
		 (id, destination_id, name, start_date, end_date, status, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		p.ID, p.DestinationID, p.Name, p.StartDate, p.EndDate, p.Status, p.CreatedAt, p.UpdatedAt,
	)
	return err
}

func (r *Repository) FindDtiPlanByID(ctx context.Context, id uuid.UUID) (*domain.DtiPlan, error) {
	p := &domain.DtiPlan{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, destination_id, name, start_date, end_date, status, created_at, updated_at
		 FROM evaluations_service.dti_plan WHERE id = $1`, id,
	).Scan(&p.ID, &p.DestinationID, &p.Name, &p.StartDate, &p.EndDate, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) FindDtiPlansByDestination(ctx context.Context, destinationID uuid.UUID) ([]*domain.DtiPlan, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, destination_id, name, start_date, end_date, status, created_at, updated_at
		 FROM evaluations_service.dti_plan WHERE destination_id = $1 ORDER BY created_at DESC`,
		destinationID,
	)
	if err != nil {
		return nil, fmt.Errorf("find dti plans by destination: %w", err)
	}
	defer rows.Close()

	var items []*domain.DtiPlan
	for rows.Next() {
		p := &domain.DtiPlan{}
		if err := rows.Scan(&p.ID, &p.DestinationID, &p.Name, &p.StartDate, &p.EndDate, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan dti plan: %w", err)
		}
		items = append(items, p)
	}
	return items, rows.Err()
}

func (r *Repository) UpdateDtiPlan(ctx context.Context, p *domain.DtiPlan) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.dti_plan
		 SET name=$1, start_date=$2, end_date=$3, status=$4, updated_at=NOW()
		 WHERE id=$5`,
		p.Name, p.StartDate, p.EndDate, p.Status, p.ID,
	)
	return err
}

func (r *Repository) DeleteDtiPlan(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.dti_plan WHERE id = $1", id,
	)
	return err
}

func (r *Repository) CountDtiPlanGoals(ctx context.Context, dtiPlanID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM evaluations_service.dti_plan_goal WHERE dti_plan_id = $1", dtiPlanID,
	).Scan(&count)
	return count, err
}

// ══════════════════════════════════════════════════════════════════════
// DtiPlanGoal
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateDtiPlanGoal(ctx context.Context, g *domain.DtiPlanGoal) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.dti_plan_goal
		 (id, dti_plan_id, indicator_id, current_score, target_score, target_date)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		g.ID, g.DtiPlanID, g.IndicatorID, g.CurrentScore, g.TargetScore, g.TargetDate,
	)
	return err
}

func (r *Repository) UpdateDtiPlanGoal(ctx context.Context, g *domain.DtiPlanGoal) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.dti_plan_goal
		 SET target_score=$1, target_date=$2
		 WHERE id=$3`,
		g.TargetScore, g.TargetDate, g.ID,
	)
	return err
}

func (r *Repository) DeleteDtiPlanGoal(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		"DELETE FROM evaluations_service.dti_plan_goal WHERE id = $1", id,
	)
	return err
}

func (r *Repository) ListDtiPlanGoals(ctx context.Context, dtiPlanID uuid.UUID) ([]*domain.DtiPlanGoal, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, dti_plan_id, indicator_id, current_score, target_score, target_date
		 FROM evaluations_service.dti_plan_goal WHERE dti_plan_id = $1 ORDER BY indicator_id`,
		dtiPlanID,
	)
	if err != nil {
		return nil, fmt.Errorf("list dti plan goals: %w", err)
	}
	defer rows.Close()

	var items []*domain.DtiPlanGoal
	for rows.Next() {
		g := &domain.DtiPlanGoal{}
		if err := rows.Scan(&g.ID, &g.DtiPlanID, &g.IndicatorID, &g.CurrentScore, &g.TargetScore, &g.TargetDate); err != nil {
			return nil, fmt.Errorf("scan dti plan goal: %w", err)
		}
		items = append(items, g)
	}
	return items, rows.Err()
}

func (r *Repository) FindDtiPlanGoalByID(ctx context.Context, id uuid.UUID) (*domain.DtiPlanGoal, error) {
	g := &domain.DtiPlanGoal{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, dti_plan_id, indicator_id, current_score, target_score, target_date
		 FROM evaluations_service.dti_plan_goal WHERE id = $1`, id,
	).Scan(&g.ID, &g.DtiPlanID, &g.IndicatorID, &g.CurrentScore, &g.TargetScore, &g.TargetDate)
	if err != nil {
		return nil, err
	}
	return g, nil
}

func (r *Repository) FindLatestIndicatorValueByDestination(ctx context.Context, destinationID, indicatorID uuid.UUID) (*domain.IndicatorValue, error) {
	iv := &domain.IndicatorValue{}
	err := r.db.QueryRowContext(ctx,
		`SELECT iv.id, iv.indicator_id, iv.evaluation_id, iv.destination_value, iv.evaluator_value,
		        iv.meta, iv.meta_date, iv.destination_observations, iv.evaluator_observations,
		        iv.is_verified, iv.verified_by, iv.verified_at, iv.is_editing_enabled,
		        iv.analisis_ia, iv.sugerencias_mejora_ia, iv.created_at, iv.updated_at
		 FROM evaluations_service.indicator_value iv
		 JOIN evaluations_service.evaluation e ON iv.evaluation_id = e.id
		 WHERE e.destination_id = $1 AND iv.indicator_id = $2
		 ORDER BY e.end_date DESC NULLS LAST, iv.created_at DESC
		 LIMIT 1`,
		destinationID, indicatorID,
	).Scan(&iv.ID, &iv.IndicatorID, &iv.EvaluationID, &iv.DestinationValue, &iv.EvaluatorValue,
		&iv.Meta, &iv.MetaDate, &iv.DestinationObservations, &iv.EvaluatorObservations,
		&iv.IsVerified, &iv.VerifiedBy, &iv.VerifiedAt, &iv.IsEditingEnabled,
		&iv.AnalisisIA, &iv.SugerenciasMejoraIA, &iv.CreatedAt, &iv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return iv, nil
}

// ══════════════════════════════════════════════════════════════════════
// Public Good Practices
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindApprovedGoodPractices(ctx context.Context, filters map[string]string) ([]*domain.PublicGoodPracticeView, error) {
	where := "WHERE gp.status = 'approved'"
	args := []interface{}{}
	argIdx := 1

	if country, ok := filters["country"]; ok && country != "" {
		where += fmt.Sprintf(" AND d.country = $%d", argIdx)
		args = append(args, country)
		argIdx++
	}
	if axis, ok := filters["axis"]; ok && axis != "" {
		where += fmt.Sprintf(" AND action.axes::jsonb @> $%d", argIdx)
		args = append(args, `["`+axis+`"]`)
		argIdx++
	}
	if scope, ok := filters["scope"]; ok && scope != "" {
		where += fmt.Sprintf(" AND action.scopes::jsonb @> $%d", argIdx)
		args = append(args, `["`+scope+`"]`)
		argIdx++
	}
	if ods, ok := filters["ods"]; ok && ods != "" {
		where += fmt.Sprintf(" AND action.ods::jsonb @> $%d", argIdx)
		args = append(args, `[{"ods_id":"`+ods+`"}]`)
		argIdx++
	}
	if search, ok := filters["search"]; ok && search != "" {
		where += fmt.Sprintf(" AND (action.name ILIKE $%d OR action.summary ILIKE $%d OR action.photo_url ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// Locale-aware LEFT JOIN for dynamic content i18n
	locale, hasLocale := filters["locale"]
	var localeJoin string
	var nameCol, summaryCol, descCol, odsCol string
	if hasLocale && locale == "pt" {
		localeJoin = ` LEFT JOIN evaluations_service.action_translation at
			ON at.action_id = action.id AND at.locale = 'pt' AND at.translation_reviewed = true`
		nameCol = "COALESCE(at.name, action.name)"
		summaryCol = "COALESCE(at.summary, action.summary)"
		descCol = "COALESCE(at.description, action.extended_description)"
		odsCol = "COALESCE(at.ods, action.ods)"
	} else {
		nameCol = "action.name"
		summaryCol = "action.summary"
		descCol = "action.extended_description"
		odsCol = "action.ods"
	}

	query := `
		SELECT action.id, ` + nameCol + `, ` + summaryCol + `, ` + descCol + `,
		       d.name, d.country,
		       dt.name, pr.name,
		       action.axes, action.scopes, ` + odsCol + `,
		       action.photo_url, action.website_url, action.awards
		FROM evaluations_service.good_practice gp
		JOIN evaluations_service.action action ON action.id = gp.action_id
		JOIN evaluations_service.destination d ON d.id = action.destination_id
		LEFT JOIN evaluations_service.destination_typology dt ON dt.id = d.typology_id
		LEFT JOIN evaluations_service.population_range pr ON pr.id = d.population_range_id
		` + localeJoin + `
		` + where + ` ORDER BY action.name`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("find approved good practices: %w", err)
	}
	defer rows.Close()

	var items []*domain.PublicGoodPracticeView
	for rows.Next() {
		item := &domain.PublicGoodPracticeView{}
		// Use intermediate []byte pointers for JSON columns to handle NULL values
		var axes, scopes, ods []byte
		if err := rows.Scan(
			&item.ActionID, &item.ActionName, &item.ActionSummary, &item.ActionDescription,
			&item.DestinationName, &item.Country,
			&item.Typology, &item.PopulationRange,
			&axes, &scopes, &ods,
			&item.PhotoURL, &item.WebsiteURL, &item.Awards,
		); err != nil {
			return nil, fmt.Errorf("scan approved good practice: %w", err)
		}
		// Assign bytes to json.RawMessage fields (empty slice if NULL)
		item.Axes = axes
		item.Scopes = scopes
		item.ODS = ods
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Fetch evidence for each GP
	for _, item := range items {
		evidenceRows, err := r.db.QueryContext(ctx,
			`SELECT type, url
			 FROM evaluations_service.action_evidence
			 WHERE action_id = $1`, item.ActionID,
		)
		if err != nil {
			return nil, fmt.Errorf("find evidence for action %s: %w", item.ActionID, err)
		}
		for evidenceRows.Next() {
			var evType string
			var url *string
			if err := evidenceRows.Scan(&evType, &url); err != nil {
				evidenceRows.Close()
				return nil, fmt.Errorf("scan evidence: %w", err)
			}
			if url != nil {
				switch evType {
				case "document":
					item.EvidenceDocs = append(item.EvidenceDocs, *url)
				case "url":
					item.EvidenceURLs = append(item.EvidenceURLs, *url)
				case "audiovisual":
					item.AudiovisualLinks = append(item.AudiovisualLinks, *url)
				case "press":
					item.PressNotes = append(item.PressNotes, *url)
				}
			}
		}
		evidenceRows.Close()
	}

	return items, nil
}

// FindApprovedGoodPracticeByActionID returns a single approved good practice with full details.
func (r *Repository) FindApprovedGoodPracticeByActionID(ctx context.Context, actionID uuid.UUID, locale string) (*domain.PublicGoodPracticeView, error) {
	item := &domain.PublicGoodPracticeView{}

	var nameCol, summaryCol, descCol, odsCol string
	var localeJoin string
	if locale == "pt" {
		localeJoin = ` LEFT JOIN evaluations_service.action_translation at
			ON at.action_id = action.id AND at.locale = 'pt' AND at.translation_reviewed = true`
		nameCol = "COALESCE(at.name, action.name)"
		summaryCol = "COALESCE(at.summary, action.summary)"
		descCol = "COALESCE(at.description, action.extended_description)"
		odsCol = "COALESCE(at.ods, action.ods)"
	} else {
		nameCol = "action.name"
		summaryCol = "action.summary"
		descCol = "action.extended_description"
		odsCol = "action.ods"
	}

	err := r.db.QueryRowContext(ctx, `
		SELECT action.id, `+nameCol+`, `+summaryCol+`, `+descCol+`,
		       d.name, d.country,
		       dt.name, pr.name,
		       action.axes, action.scopes, `+odsCol+`,
		       action.photo_url, action.website_url, action.awards
		FROM evaluations_service.good_practice gp
		JOIN evaluations_service.action action ON action.id = gp.action_id
		JOIN evaluations_service.destination d ON d.id = action.destination_id
		LEFT JOIN evaluations_service.destination_typology dt ON dt.id = d.typology_id
		LEFT JOIN evaluations_service.population_range pr ON pr.id = d.population_range_id
		` + localeJoin + `
		WHERE gp.action_id = $1 AND gp.status = 'approved'`,
		actionID,
	).Scan(
		&item.ActionID, &item.ActionName, &item.ActionSummary, &item.ActionDescription,
		&item.DestinationName, &item.Country,
		&item.Typology, &item.PopulationRange,
		&item.Axes, &item.Scopes, &item.ODS,
		&item.PhotoURL, &item.WebsiteURL, &item.Awards,
	)
	if err != nil {
		return nil, err
	}

	// Fetch evidence
	evidenceRows, err := r.db.QueryContext(ctx,
		`SELECT type, url FROM evaluations_service.action_evidence WHERE action_id = $1`, actionID,
	)
	if err != nil {
		return nil, fmt.Errorf("find evidence for action %s: %w", actionID, err)
	}
	defer evidenceRows.Close()

	for evidenceRows.Next() {
		var evType string
		var url *string
		if err := evidenceRows.Scan(&evType, &url); err != nil {
			return nil, fmt.Errorf("scan evidence: %w", err)
		}
		if url != nil {
			switch evType {
			case "document":
				item.EvidenceDocs = append(item.EvidenceDocs, *url)
			case "url":
				item.EvidenceURLs = append(item.EvidenceURLs, *url)
			case "audiovisual":
				item.AudiovisualLinks = append(item.AudiovisualLinks, *url)
			case "press":
				item.PressNotes = append(item.PressNotes, *url)
			}
		}
	}

	return item, nil
}

// ══════════════════════════════════════════════════════════════════════
// Indicator (read by ID)
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) FindIndicatorByID(ctx context.Context, id uuid.UUID) (*domain.Indicator, error) {
	item := &domain.Indicator{}
	var criteriaBytes []byte
	err := r.db.QueryRowContext(ctx,
		"SELECT "+indicatorCols+" FROM evaluations_service.indicator i WHERE i.id = $1", id,
	).Scan(&item.ID, &item.RequirementID, &item.Code, &item.Name, &item.Description, &item.Type, &criteriaBytes, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return nil, err
	}
	item.Criteria = criteriaBytes
	return item, nil
}

// ══════════════════════════════════════════════════════════════════════
// IndicatorValue
// ══════════════════════════════════════════════════════════════════════

const indicatorValueCols = "id, indicator_id, evaluation_id, destination_value, evaluator_value, meta, meta_date, destination_observations, evaluator_observations, is_verified, verified_by, verified_at, is_editing_enabled, analisis_ia, sugerencias_mejora_ia, created_at, updated_at"

func (r *Repository) FindIndicatorValueByID(ctx context.Context, id uuid.UUID) (*domain.IndicatorValue, error) {
	iv := &domain.IndicatorValue{}
	err := r.db.QueryRowContext(ctx,
		"SELECT "+indicatorValueCols+" FROM evaluations_service.indicator_value WHERE id = $1", id,
	).Scan(&iv.ID, &iv.IndicatorID, &iv.EvaluationID, &iv.DestinationValue, &iv.EvaluatorValue,
		&iv.Meta, &iv.MetaDate, &iv.DestinationObservations, &iv.EvaluatorObservations,
		&iv.IsVerified, &iv.VerifiedBy, &iv.VerifiedAt, &iv.IsEditingEnabled,
		&iv.AnalisisIA, &iv.SugerenciasMejoraIA, &iv.CreatedAt, &iv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return iv, nil
}

func (r *Repository) FindIndicatorValueByEvalAndIndicator(ctx context.Context, evaluationID, indicatorID uuid.UUID) (*domain.IndicatorValue, error) {
	iv := &domain.IndicatorValue{}
	err := r.db.QueryRowContext(ctx,
		"SELECT "+indicatorValueCols+" FROM evaluations_service.indicator_value WHERE evaluation_id = $1 AND indicator_id = $2",
		evaluationID, indicatorID,
	).Scan(&iv.ID, &iv.IndicatorID, &iv.EvaluationID, &iv.DestinationValue, &iv.EvaluatorValue,
		&iv.Meta, &iv.MetaDate, &iv.DestinationObservations, &iv.EvaluatorObservations,
		&iv.IsVerified, &iv.VerifiedBy, &iv.VerifiedAt, &iv.IsEditingEnabled,
		&iv.AnalisisIA, &iv.SugerenciasMejoraIA, &iv.CreatedAt, &iv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return iv, nil
}

func (r *Repository) CreateIndicatorValue(ctx context.Context, iv *domain.IndicatorValue) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.indicator_value
		 (id, indicator_id, evaluation_id, destination_value, evaluator_value,
		  meta, meta_date, destination_observations, evaluator_observations,
		  is_verified, verified_by, verified_at, is_editing_enabled,
		  analisis_ia, sugerencias_mejora_ia, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
		iv.ID, iv.IndicatorID, iv.EvaluationID,
		iv.DestinationValue, iv.EvaluatorValue,
		iv.Meta, iv.MetaDate, iv.DestinationObservations, iv.EvaluatorObservations,
		iv.IsVerified, iv.VerifiedBy, iv.VerifiedAt, iv.IsEditingEnabled,
		iv.AnalisisIA, iv.SugerenciasMejoraIA, iv.CreatedAt, iv.UpdatedAt,
	)
	return err
}

func (r *Repository) UpdateIndicatorValue(ctx context.Context, iv *domain.IndicatorValue) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.indicator_value
		 SET destination_value=$1, evaluator_value=$2, meta=$3, meta_date=$4,
		     destination_observations=$5, evaluator_observations=$6,
		     is_verified=$7, verified_by=$8, verified_at=$9, is_editing_enabled=$10,
		     analisis_ia=$11, sugerencias_mejora_ia=$12,
		     updated_at=NOW()
		 WHERE id=$13`,
		iv.DestinationValue, iv.EvaluatorValue, iv.Meta, iv.MetaDate,
		iv.DestinationObservations, iv.EvaluatorObservations,
		iv.IsVerified, iv.VerifiedBy, iv.VerifiedAt, iv.IsEditingEnabled,
		iv.AnalisisIA, iv.SugerenciasMejoraIA,
		iv.ID,
	)
	return err
}

func (r *Repository) DeleteIndicatorValueContent(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.indicator_value
		 SET destination_value=NULL, meta=NULL, meta_date=NULL, destination_observations=NULL,
		     updated_at=NOW()
		 WHERE id=$1`,
		id,
	)
	return err
}

// ══════════════════════════════════════════════════════════════════════
// IndicatorHistory
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateIndicatorHistory(ctx context.Context, h *domain.IndicatorHistory) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.indicator_history
		 (id, indicator_value_id, previous_evaluation_id, destination_value, evaluator_value, meta, observations, source, created_at, modified_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		h.ID, h.IndicatorValueID, h.PreviousEvaluationID,
		h.DestinationValue, h.EvaluatorValue, h.Meta, h.Observations, h.Source, h.CreatedAt, h.ModifiedBy,
	)
	return err
}

func (r *Repository) ListIndicatorHistory(ctx context.Context, indicatorValueID uuid.UUID) ([]*domain.IndicatorHistory, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, indicator_value_id, previous_evaluation_id, destination_value, evaluator_value, meta, observations, source, created_at, modified_by
		 FROM evaluations_service.indicator_history
		 WHERE indicator_value_id = $1 ORDER BY created_at ASC`,
		indicatorValueID,
	)
	if err != nil {
		return nil, fmt.Errorf("list indicator history: %w", err)
	}
	defer rows.Close()

	var items []*domain.IndicatorHistory
	for rows.Next() {
		h := &domain.IndicatorHistory{}
		if err := rows.Scan(&h.ID, &h.IndicatorValueID, &h.PreviousEvaluationID,
			&h.DestinationValue, &h.EvaluatorValue, &h.Meta, &h.Observations, &h.Source, &h.CreatedAt, &h.ModifiedBy); err != nil {
			return nil, fmt.Errorf("scan indicator history: %w", err)
		}
		items = append(items, h)
	}
	return items, rows.Err()
}

// ══════════════════════════════════════════════════════════════════════
// IndicatorMessage
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateIndicatorMessage(ctx context.Context, m *domain.IndicatorMessage) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.indicator_message
		 (id, indicator_value_id, user_id, message, created_at)
		 VALUES ($1,$2,$3,$4,$5)`,
		m.ID, m.IndicatorValueID, m.UserID, m.Message, m.CreatedAt,
	)
	return err
}

func (r *Repository) ListIndicatorMessages(ctx context.Context, indicatorValueID uuid.UUID) ([]*domain.IndicatorMessage, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT m.id, m.indicator_value_id, m.user_id, m.message, m.created_at,
		        COALESCE(u.fullname, '') AS user_name,
		        COALESCE(p.avatarurl, '') AS user_avatar
		 FROM evaluations_service.indicator_message m
		 LEFT JOIN users_service.user u ON u.id = m.user_id
		 LEFT JOIN users_service.userprofile p ON p.userid = m.user_id
		 WHERE m.indicator_value_id = $1 ORDER BY m.created_at ASC`,
		indicatorValueID,
	)
	if err != nil {
		return nil, fmt.Errorf("list indicator messages: %w", err)
	}
	defer rows.Close()

	var items []*domain.IndicatorMessage
	for rows.Next() {
		m := &domain.IndicatorMessage{}
		if err := rows.Scan(&m.ID, &m.IndicatorValueID, &m.UserID, &m.Message, &m.CreatedAt,
			&m.UserName, &m.UserAvatar); err != nil {
			return nil, fmt.Errorf("scan indicator message: %w", err)
		}
		items = append(items, m)
	}
	return items, rows.Err()
}

// ══════════════════════════════════════════════════════════════════════
// ActionTranslation
// ══════════════════════════════════════════════════════════════════════

func (r *Repository) CreateTranslation(ctx context.Context, t *domain.ActionTranslation) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.action_translation
		 (id, action_id, locale, name, summary, description, ods, translated_at, translation_reviewed)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		t.ID, t.ActionID, t.Locale, t.Name, t.Summary, t.Description, t.ODS, t.TranslatedAt, t.TranslationReviewed,
	)
	return err
}

func (r *Repository) FindTranslationByActionAndLocale(ctx context.Context, actionID uuid.UUID, locale string) (*domain.ActionTranslation, error) {
	t := &domain.ActionTranslation{}
	var summary, description, ods []byte
	err := r.db.QueryRowContext(ctx,
		`SELECT id, action_id, locale, name, summary, description, ods, translated_at, translation_reviewed, reviewed_by, reviewed_at
		 FROM evaluations_service.action_translation
		 WHERE action_id = $1 AND locale = $2`,
		actionID, locale,
	).Scan(&t.ID, &t.ActionID, &t.Locale, &t.Name, &summary, &description, &ods, &t.TranslatedAt, &t.TranslationReviewed, &t.ReviewedBy, &t.ReviewedAt)
	if err != nil {
		return nil, err
	}
	if summary != nil {
		s := string(summary)
		t.Summary = &s
	}
	if description != nil {
		d := string(description)
		t.Description = &d
	}
	t.ODS = ods
	return t, nil
}

func (r *Repository) ListPendingTranslations(ctx context.Context, locale string, reviewed *bool) ([]*domain.ActionTranslation, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if locale != "" {
		where += fmt.Sprintf(" AND locale = $%d", argIdx)
		args = append(args, locale)
		argIdx++
	}
	if reviewed != nil {
		where += fmt.Sprintf(" AND translation_reviewed = $%d", argIdx)
		args = append(args, *reviewed)
		argIdx++
	}

	query := fmt.Sprintf(`SELECT id, action_id, locale, name, summary, description, ods, translated_at, translation_reviewed, reviewed_by, reviewed_at
		 FROM evaluations_service.action_translation %s ORDER BY translated_at DESC`, where)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list pending translations: %w", err)
	}
	defer rows.Close()

	var items []*domain.ActionTranslation
	for rows.Next() {
		t := &domain.ActionTranslation{}
		var summary, description, ods []byte
		if err := rows.Scan(&t.ID, &t.ActionID, &t.Locale, &t.Name, &summary, &description, &ods, &t.TranslatedAt, &t.TranslationReviewed, &t.ReviewedBy, &t.ReviewedAt); err != nil {
			return nil, fmt.Errorf("scan translation: %w", err)
		}
		if summary != nil {
			s := string(summary)
			t.Summary = &s
		}
		if description != nil {
			d := string(description)
			t.Description = &d
		}
		t.ODS = ods
		items = append(items, t)
	}
	return items, rows.Err()
}

func (r *Repository) UpdateTranslation(ctx context.Context, t *domain.ActionTranslation) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.action_translation
		 SET name = $1, summary = $2, description = $3, ods = $4, translation_reviewed = $5, reviewed_by = $6, reviewed_at = $7
		 WHERE id = $8`,
		t.Name, t.Summary, t.Description, t.ODS, t.TranslationReviewed, t.ReviewedBy, t.ReviewedAt, t.ID,
	)
	return err
}

// EnsureActionTranslation inserts or updates an action_translation row.
// Uses INSERT ... ON CONFLICT DO UPDATE to handle re-runs gracefully.
func (r *Repository) EnsureActionTranslation(ctx context.Context, actionID uuid.UUID, locale, sourceName, sourceSummary, sourceDescription, sourceODS string) error {
	now := time.Now()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.action_translation
		 (id, action_id, locale, name, summary, description, ods, translated_at, translation_reviewed)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
		 ON CONFLICT (action_id, locale) DO UPDATE SET
		   name = EXCLUDED.name,
		   summary = EXCLUDED.summary,
		   description = EXCLUDED.description,
		   ods = EXCLUDED.ods,
		   translated_at = EXCLUDED.translated_at,
		   translation_reviewed = true`,
		uuid.New(), actionID, locale, sourceName,
		nullString(sourceSummary),
		nullString(sourceDescription),
		nullString(sourceODS),
		now,
	)
	return err
}

func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

func (r *Repository) CreateCatalogTranslation(ctx context.Context, t *domain.CatalogTranslation) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.catalog_translation
		 (id, entity_type, entity_id, locale, name, description, criteria, translated_at, translation_reviewed)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		t.ID, t.EntityType, t.EntityID, t.Locale, t.Name, t.Description, t.Criteria, t.TranslatedAt, t.TranslationReviewed,
	)
	return err
}

func (r *Repository) FindCatalogTranslation(ctx context.Context, entityType string, entityID uuid.UUID, locale string) (*domain.CatalogTranslation, error) {
	t := &domain.CatalogTranslation{}
	var name, description, criteria []byte
	err := r.db.QueryRowContext(ctx,
		`SELECT id, entity_type, entity_id, locale, name, description, criteria, translated_at, translation_reviewed, reviewed_by, reviewed_at
		 FROM evaluations_service.catalog_translation
		 WHERE entity_type = $1 AND entity_id = $2 AND locale = $3`,
		entityType, entityID, locale,
	).Scan(&t.ID, &t.EntityType, &t.EntityID, &t.Locale, &name, &description, &criteria, &t.TranslatedAt, &t.TranslationReviewed, &t.ReviewedBy, &t.ReviewedAt)
	if err != nil {
		return nil, err
	}
	if name != nil {
		n := string(name)
		t.Name = &n
	}
	if description != nil {
		d := string(description)
		t.Description = &d
	}
	if criteria != nil {
		c := string(criteria)
		t.Criteria = &c
	}
	return t, nil
}

func (r *Repository) ListCatalogTranslations(ctx context.Context, entityType, locale string, reviewed *bool) ([]*domain.CatalogTranslation, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if entityType != "" {
		where += fmt.Sprintf(" AND entity_type = $%d", argIdx)
		args = append(args, entityType)
		argIdx++
	}
	if locale != "" {
		where += fmt.Sprintf(" AND locale = $%d", argIdx)
		args = append(args, locale)
		argIdx++
	}
	if reviewed != nil {
		where += fmt.Sprintf(" AND translation_reviewed = $%d", argIdx)
		args = append(args, *reviewed)
		argIdx++
	}

	query := fmt.Sprintf(`SELECT id, entity_type, entity_id, locale, name, description, translated_at, translation_reviewed, reviewed_by, reviewed_at
		 FROM evaluations_service.catalog_translation %s ORDER BY translated_at DESC`, where)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list catalog translations: %w", err)
	}
	defer rows.Close()

	var items []*domain.CatalogTranslation
	for rows.Next() {
		t := &domain.CatalogTranslation{}
		var name, description []byte
		if err := rows.Scan(&t.ID, &t.EntityType, &t.EntityID, &t.Locale, &name, &description, &t.TranslatedAt, &t.TranslationReviewed, &t.ReviewedBy, &t.ReviewedAt); err != nil {
			return nil, fmt.Errorf("scan catalog translation: %w", err)
		}
		if name != nil {
			n := string(name)
			t.Name = &n
		}
		if description != nil {
			d := string(description)
			t.Description = &d
		}
		items = append(items, t)
	}
	return items, rows.Err()
}

func (r *Repository) UpdateCatalogTranslation(ctx context.Context, t *domain.CatalogTranslation) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE evaluations_service.catalog_translation
		 SET name = $1, description = $2, translation_reviewed = $3, reviewed_by = $4, reviewed_at = $5
		 WHERE id = $6`,
		t.Name, t.Description, t.TranslationReviewed, t.ReviewedBy, t.ReviewedAt, t.ID,
	)
	return err
}

func schemaTable(table string) string {
	if strings.Contains(table, ".") {
		return table
	}
	return "evaluations_service." + table
}
