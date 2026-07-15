package postgres

import (
	"context"
	"fmt"

	"evaluations-service/internal/domain"

	"github.com/google/uuid"
)

const reportCols = "id, evaluation_id, destination_id, year, name, file_url, created_at, created_by"

func (r *Repository) FindAllReports(ctx context.Context) ([]*domain.Report, error) {
	rows, err := r.db.QueryContext(ctx,
		"SELECT "+reportCols+" FROM evaluations_service.report ORDER BY year DESC, created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("find all reports: %w", err)
	}
	defer rows.Close()

	var items []*domain.Report
	for rows.Next() {
		item := &domain.Report{}
		if err := rows.Scan(&item.ID, &item.EvaluationID, &item.DestinationID,
			&item.Year, &item.Name, &item.FileURL, &item.CreatedAt, &item.CreatedBy); err != nil {
			return nil, fmt.Errorf("scan report: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) FindReportByID(ctx context.Context, id uuid.UUID) (*domain.Report, error) {
	item := &domain.Report{}
	err := r.db.QueryRowContext(ctx,
		"SELECT "+reportCols+" FROM evaluations_service.report WHERE id = $1", id,
	).Scan(&item.ID, &item.EvaluationID, &item.DestinationID,
		&item.Year, &item.Name, &item.FileURL, &item.CreatedAt, &item.CreatedBy)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *Repository) CreateReport(ctx context.Context, entity *domain.Report) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO evaluations_service.report
		 (id, evaluation_id, destination_id, year, name, file_url, created_at, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		entity.ID, entity.EvaluationID, entity.DestinationID,
		entity.Year, entity.Name, entity.FileURL, entity.CreatedAt, entity.CreatedBy,
	)
	return err
}
