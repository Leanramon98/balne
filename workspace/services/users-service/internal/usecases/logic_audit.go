package usecases

import (
	"context"

	"users-service/internal/domain"
	portin "users-service/internal/ports/in"
)

func (l *Logic) GetAuditLogs(ctx context.Context, req portin.GetAuditLogsRequest) (portin.GetAuditLogsResponse, error) {
	panic("GetAuditLogs: not implemented")
}

func (l *Logic) GetUserHistory(ctx context.Context, id string) ([]*domain.UserHistory, error) {
	panic("GetUserHistory: not implemented")
}
