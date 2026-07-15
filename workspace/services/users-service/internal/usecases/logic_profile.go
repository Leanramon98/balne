package usecases

import (
	"context"
	"errors"
	"time"

	"users-service/internal/domain"
	portin "users-service/internal/ports/in"
)

func (l *Logic) GetProfile(ctx context.Context, req portin.GetProfileRequest) (portin.GetProfileResponse, error) {
	if req.UserID == "" {
		return portin.GetProfileResponse{}, errors.New("user_id is required")
	}
	user, err := l.users.FindByID(ctx, req.UserID)
	if err != nil {
		return portin.GetProfileResponse{}, err
	}
	if user == nil {
		return portin.GetProfileResponse{}, errors.New("user not found")
	}
	return portin.GetProfileResponse{Item: user}, nil
}

func (l *Logic) PutProfile(ctx context.Context, req portin.PutProfileRequest) (portin.PutProfileResponse, error) {
	if req.Body == nil {
		return portin.PutProfileResponse{}, errors.New("body is required")
	}
	userID := req.Body.UserID.String()
	if userID == "" || userID == "00000000-0000-0000-0000-000000000000" {
		return portin.PutProfileResponse{}, errors.New("user_id is required")
	}

	user, err := l.users.FindByID(ctx, userID)
	if err != nil {
		return portin.PutProfileResponse{}, err
	}
	if user == nil {
		return portin.PutProfileResponse{}, errors.New("user not found")
	}

	// Update basic user fields from the profile body.
	if req.Body.FullName != "" {
		user.FullName = req.Body.FullName
	}
	if req.Body.Email != "" {
		user.Email = req.Body.Email
	}
	if req.Body.Phone != "" {
		user.Phone = req.Body.Phone
	}
	user.UpdatedAt = time.Now()

	if err := l.users.Update(ctx, user); err != nil {
		return portin.PutProfileResponse{}, err
	}

	return portin.PutProfileResponse{Item: &domain.UserProfile{
		UserID: user.ID,
	}}, nil
}
