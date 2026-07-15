package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"evaluations-service/internal/domain"
)

// FindResults returns aggregated evaluation results for all destinations,
// optionally filtered by the provided filters.
func (r *Repository) FindResults(ctx context.Context, filters domain.ResultsFilters) ([]*domain.ResultsData, error) {
	var args []interface{}
	argIdx := 1
	where := "e.status = 'cerrada'"

	if filters.Year > 0 {
		where += fmt.Sprintf(" AND EXTRACT(YEAR FROM e.start_date) = $%d", argIdx)
		args = append(args, filters.Year)
		argIdx++
	}
	if filters.ScopeID != "" {
		where += fmt.Sprintf(" AND s.id = $%d::uuid", argIdx)
		args = append(args, filters.ScopeID)
		argIdx++
	}
	if filters.Axis != "" {
		where += fmt.Sprintf(" AND s.axis = $%d", argIdx)
		args = append(args, filters.Axis)
		argIdx++
	}
	if filters.Country != "" {
		where += fmt.Sprintf(" AND d.country = $%d", argIdx)
		args = append(args, filters.Country)
		argIdx++
	}
	if filters.TypologyID != "" {
		where += fmt.Sprintf(" AND d.typology_id = $%d::uuid", argIdx)
		args = append(args, filters.TypologyID)
		argIdx++
	}
	if filters.MemberTypeID == "all" {
		// No filter — include all member types
	} else if filters.MemberTypeID != "" {
		where += fmt.Sprintf(" AND d.member_type_id = $%d::uuid", argIdx)
		args = append(args, filters.MemberTypeID)
		argIdx++
	} else {
		// Default: exclude "Ejemplo" (demo/training) destinations
		where += " AND (d.member_type_id IS NULL OR d.member_type_id != (SELECT id FROM evaluations_service.member_type WHERE name = 'Ejemplo'))"
	}
	if filters.DestinationID != "" {
		where += fmt.Sprintf(" AND d.id = $%d::uuid", argIdx)
		args = append(args, filters.DestinationID)
		argIdx++
	}

	query := fmt.Sprintf(`
		WITH dest_data AS (
			SELECT
				d.id AS dest_id,
				d.name AS dest_name,
				d.country,
				COALESCE(dt.name, '') AS typology,
				COALESCE(pr.name, '') AS population_range,
				i.id AS indicator_id,
				iv.destination_value,
				s.acronym AS scope_acronym,
				s.axis AS axis_key
			FROM evaluations_service.destination d
			LEFT JOIN evaluations_service.destination_typology dt ON dt.id = d.typology_id
			LEFT JOIN evaluations_service.population_range pr ON pr.id = d.population_range_id
			JOIN evaluations_service.evaluation e ON e.destination_id = d.id
			JOIN evaluations_service.indicator_value iv ON iv.evaluation_id = e.id
			JOIN evaluations_service.indicator i ON i.id = iv.indicator_id
			JOIN evaluations_service.requirement r ON r.id = i.requirement_id
			JOIN evaluations_service.scope s ON s.id = r.scope_id
			WHERE %s
		),
		dest_agg AS (
			SELECT
				dest_id,
				dest_name,
				country,
				typology,
				population_range,
				COUNT(DISTINCT indicator_id) AS total_indicators,
				COUNT(DISTINCT CASE WHEN destination_value IS NOT NULL THEN indicator_id END) AS completed_indicators,
				COALESCE(AVG(destination_value), 0)::numeric(10,2) AS total_compliance
			FROM dest_data
			GROUP BY dest_id, dest_name, country, typology, population_range
		),
		scope_agg AS (
			SELECT
				dest_id,
				jsonb_object_agg(scope_acronym, scope_pct) AS by_scope
			FROM (
				SELECT
					dest_id,
					scope_acronym,
					ROUND(AVG(destination_value), 2) AS scope_pct
				FROM dest_data
				GROUP BY dest_id, scope_acronym
			) scope_sub
			GROUP BY dest_id
		),
		axis_agg AS (
			SELECT
				dest_id,
				jsonb_object_agg(axis_key, axis_pct) AS by_axis
			FROM (
				SELECT
					dest_id,
					axis_key,
					ROUND(AVG(destination_value), 2) AS axis_pct
				FROM dest_data
				GROUP BY dest_id, axis_key
			) axis_sub
			GROUP BY dest_id
		),
		scope_indicator_counts AS (
			SELECT
				dest_id,
				jsonb_object_agg(scope_acronym, completed) AS completed_by_scope,
				jsonb_object_agg(scope_acronym, total) AS total_by_scope
			FROM (
				SELECT
					dest_id,
					scope_acronym,
					COUNT(DISTINCT CASE WHEN destination_value IS NOT NULL THEN indicator_id END) AS completed,
					COUNT(DISTINCT indicator_id) AS total
				FROM dest_data
				GROUP BY dest_id, scope_acronym
			) scope_cnt_sub
			GROUP BY dest_id
		)
		SELECT
			da.dest_id,
			da.dest_name,
			da.country,
			da.typology,
			da.population_range,
			da.total_indicators,
			da.completed_indicators,
			da.total_compliance,
			COALESCE(sa.by_scope, '{}'::jsonb),
			COALESCE(aa.by_axis, '{}'::jsonb),
			COALESCE(sic.completed_by_scope, '{}'::jsonb),
			COALESCE(sic.total_by_scope, '{}'::jsonb)
		FROM dest_agg da
		LEFT JOIN scope_agg sa ON sa.dest_id = da.dest_id
		LEFT JOIN axis_agg aa ON aa.dest_id = da.dest_id
		LEFT JOIN scope_indicator_counts sic ON sic.dest_id = da.dest_id
		ORDER BY da.dest_name
	`, where)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("find results: %w", err)
	}
	defer rows.Close()

	var items []*domain.ResultsData
	for rows.Next() {
		var (
			item                          domain.ResultsData
			scopeJSON, axisJSON           []byte
			completedByScopeJSON          []byte
			totalByScopeJSON              []byte
		)
		if err := rows.Scan(
			&item.DestinationID,
			&item.DestinationName,
			&item.Country,
			&item.Typology,
			&item.PopulationRange,
			&item.TotalIndicators,
			&item.CompletedIndicators,
			&item.TotalCompliance,
			&scopeJSON,
			&axisJSON,
			&completedByScopeJSON,
			&totalByScopeJSON,
		); err != nil {
			return nil, fmt.Errorf("scan result row: %w", err)
		}

		item.PercentageByScope = make(map[string]float64)
		if len(scopeJSON) > 0 {
			if err := json.Unmarshal(scopeJSON, &item.PercentageByScope); err != nil {
				return nil, fmt.Errorf("unmarshal percentage_by_scope: %w", err)
			}
		}

		item.PercentageByAxis = make(map[string]float64)
		if len(axisJSON) > 0 {
			if err := json.Unmarshal(axisJSON, &item.PercentageByAxis); err != nil {
				return nil, fmt.Errorf("unmarshal percentage_by_axis: %w", err)
			}
		}

		item.CompletedByScope = make(map[string]int)
		if len(completedByScopeJSON) > 0 {
			if err := json.Unmarshal(completedByScopeJSON, &item.CompletedByScope); err != nil {
				return nil, fmt.Errorf("unmarshal completed_by_scope: %w", err)
			}
		}

		item.TotalByScope = make(map[string]int)
		if len(totalByScopeJSON) > 0 {
			if err := json.Unmarshal(totalByScopeJSON, &item.TotalByScope); err != nil {
				return nil, fmt.Errorf("unmarshal total_by_scope: %w", err)
			}
		}

		items = append(items, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	if items == nil {
		items = []*domain.ResultsData{}
	}

	return items, nil
}
