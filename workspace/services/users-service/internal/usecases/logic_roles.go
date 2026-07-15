package usecases

import (
	"context"

	portin "users-service/internal/ports/in"
)

func (l *Logic) GetRoles(ctx context.Context, req portin.GetRolesRequest) (portin.GetRolesResponse, error) {
	roles, err := l.roles.FindAll(ctx)
	if err != nil {
		return portin.GetRolesResponse{}, err
	}
	return portin.GetRolesResponse{Items: roles, Total: len(roles)}, nil
}

func (l *Logic) PostRoles(ctx context.Context, req portin.PostRolesRequest) (portin.PostRolesResponse, error) {
	panic("PostRoles: not implemented")
}
