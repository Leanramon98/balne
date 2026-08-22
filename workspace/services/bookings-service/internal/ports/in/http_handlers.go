package portin

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/Leanramon98/balne/workspace/services/bookings-service/internal/domain"
)

// BookingsUseCase is the driving port — the contract every inbound adapter
// (HTTP handlers) calls. Implemented by internal/usecases.Logic.
//
// File named http_handlers.go because it defines the handler-facing
// operations; this mirrors users-service's ports/in use-case port.
type BookingsUseCase interface {
	// Balnearios
	CreateBalneario(ctx context.Context, name, slug, location string) (*domain.Balneario, error)
	GetBalnearioBySlug(ctx context.Context, slug string) (*domain.Balneario, error)
	ListBalnearios(ctx context.Context) ([]*domain.Balneario, error)
	GetPlan(ctx context.Context, balnearioID uuid.UUID) ([]*domain.PlanUnit, error)

	// Plan units
	UpdatePlanUnit(ctx context.Context, u *domain.PlanUnit) error

	// Availability
	GetAvailability(ctx context.Context, slug string, start, end time.Time) ([]*domain.PlanUnit, error)

	// Customers
	CreateCustomer(ctx context.Context, name, email, phone string) (*domain.Customer, error)
	SearchCustomers(ctx context.Context, query string) ([]*domain.Customer, error)

	// Reservations (CreateReservation performs server-side conflict detection)
	CreateReservation(ctx context.Context, r *domain.Reservation) (*domain.Reservation, error)
	ListReservations(ctx context.Context, balnearioID *uuid.UUID, status string) ([]*domain.Reservation, error)
	UpdateReservationStatus(ctx context.Context, id uuid.UUID, status string) error

	// Tariffs
	ListTariffs(ctx context.Context, balnearioID uuid.UUID) ([]*domain.Tariff, error)
	CreateTariff(ctx context.Context, t *domain.Tariff) (*domain.Tariff, error)
}
