package portout

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/Leanramon98/balne/workspace/services/bookings-service/internal/domain"
)

// Repository is the driven port for the bookings domain.
// All persistence for balnearios, plan units, tariffs, customers and
// reservations goes through this single contract, implemented by the
// postgres adapter. Every query uses parameterized SQL — no string interpolation.
type Repository interface {
	// Balnearios
	CreateBalneario(ctx context.Context, b *domain.Balneario) error
	GetBalnearioByID(ctx context.Context, id uuid.UUID) (*domain.Balneario, error)
	GetBalnearioBySlug(ctx context.Context, slug string) (*domain.Balneario, error)
	ListBalnearios(ctx context.Context) ([]*domain.Balneario, error)

	// Plan units
	GetPlanUnitsByBalneario(ctx context.Context, balnearioID uuid.UUID) ([]*domain.PlanUnit, error)
	GetPlanUnitByID(ctx context.Context, id uuid.UUID) (*domain.PlanUnit, error)
	UpdatePlanUnit(ctx context.Context, u *domain.PlanUnit) error

	// Tariffs
	ListTariffsByBalneario(ctx context.Context, balnearioID uuid.UUID) ([]*domain.Tariff, error)
	CreateTariff(ctx context.Context, t *domain.Tariff) error

	// Customers
	CreateCustomer(ctx context.Context, c *domain.Customer) error
	GetCustomerByID(ctx context.Context, id uuid.UUID) (*domain.Customer, error)
	SearchCustomers(ctx context.Context, query string) ([]*domain.Customer, error)

	// Reservations
	CreateReservation(ctx context.Context, r *domain.Reservation) error
	GetReservationByID(ctx context.Context, id uuid.UUID) (*domain.Reservation, error)
	GetReservationsByDateRange(ctx context.Context, balnearioID uuid.UUID, start, end time.Time) ([]*domain.Reservation, error)
	GetReservationsByUnitAndDateRange(ctx context.Context, unitID uuid.UUID, start, end time.Time) ([]*domain.Reservation, error)
	ListReservations(ctx context.Context, balnearioID *uuid.UUID, status string) ([]*domain.Reservation, error)
	UpdateReservationStatus(ctx context.Context, id uuid.UUID, status string) error

	// Availability: plan units with no active reservation overlapping [start, end).
	GetAvailableUnits(ctx context.Context, balnearioID uuid.UUID, start, end time.Time) ([]*domain.PlanUnit, error)
}
