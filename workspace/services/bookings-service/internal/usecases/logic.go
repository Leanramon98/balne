package usecases

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/Leanramon98/balne/workspace/services/bookings-service/internal/domain"
	portin "github.com/Leanramon98/balne/workspace/services/bookings-service/internal/ports/in"
	portout "github.com/Leanramon98/balne/workspace/services/bookings-service/internal/ports/out"
)

// Logic implements portin.BookingsUseCase.
type Logic struct {
	repo portout.Repository
}

// LogicOption is a functional option for configuring Logic.
type LogicOption func(*Logic)

// WithRepository injects the driven Repository.
func WithRepository(repo portout.Repository) LogicOption {
	return func(l *Logic) {
		l.repo = repo
	}
}

// NewLogic constructs the use case with its dependencies.
func NewLogic(opts ...LogicOption) *Logic {
	l := &Logic{}
	for _, opt := range opts {
		opt(l)
	}
	return l
}

// Ensure Logic satisfies the driving port at compile time.
var _ portin.BookingsUseCase = (*Logic)(nil)

// Sentinel errors are owned by the domain package; aliases keep the use case
// body readable while ensuring errors.Is resolves to the same value across
// the port boundary (inbound adapters compare against domain.ErrX).
var (
	ErrBalnearioNotFound   = domain.ErrBalnearioNotFound
	ErrPlanUnitNotFound    = domain.ErrPlanUnitNotFound
	ErrCustomerNotFound    = domain.ErrCustomerNotFound
	ErrReservationNotFound = domain.ErrReservationNotFound
	ErrReservationConflict = domain.ErrReservationConflict
	ErrInvalidDateRange    = domain.ErrInvalidDateRange
	ErrInvalidReservation  = domain.ErrInvalidReservation
	ErrUnitNotInBalneario  = domain.ErrUnitNotInBalneario
	ErrUnitNotRentable     = domain.ErrUnitNotRentable
	ErrInvalidStatus       = domain.ErrInvalidStatus
	ErrInvalidSlug         = domain.ErrInvalidSlug
)

// normalizeSlug lowercases and trims the slug and validates it is non-empty.
func normalizeSlug(slug string) (string, error) {
	s := strings.ToLower(strings.TrimSpace(slug))
	if s == "" {
		return "", ErrInvalidSlug
	}
	return s, nil
}

// ---------------- Balnearios ----------------

func (l *Logic) CreateBalneario(ctx context.Context, name, slug, location string) (*domain.Balneario, error) {
	slug, err := normalizeSlug(slug)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("name is required")
	}
	now := time.Now().UTC()
	b := &domain.Balneario{
		ID:        uuid.New(),
		Name:      strings.TrimSpace(name),
		Slug:      slug,
		Location:  strings.TrimSpace(location),
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := l.repo.CreateBalneario(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (l *Logic) GetBalnearioBySlug(ctx context.Context, slug string) (*domain.Balneario, error) {
	slug, err := normalizeSlug(slug)
	if err != nil {
		return nil, err
	}
	b, err := l.repo.GetBalnearioBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, ErrBalnearioNotFound
	}
	return b, nil
}

func (l *Logic) ListBalnearios(ctx context.Context) ([]*domain.Balneario, error) {
	return l.repo.ListBalnearios(ctx)
}

func (l *Logic) GetPlan(ctx context.Context, balnearioID uuid.UUID) ([]*domain.PlanUnit, error) {
	return l.repo.GetPlanUnitsByBalneario(ctx, balnearioID)
}

func (l *Logic) SavePlan(ctx context.Context, balnearioID uuid.UUID, units []*domain.PlanUnit) ([]*domain.PlanUnit, error) {
	b, err := l.repo.GetBalnearioByID(ctx, balnearioID)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, ErrBalnearioNotFound
	}
	if err := l.repo.SavePlanUnits(ctx, balnearioID, units); err != nil {
		return nil, err
	}
	return l.repo.GetPlanUnitsByBalneario(ctx, balnearioID)
}

// ---------------- Plan units ----------------

func (l *Logic) UpdatePlanUnit(ctx context.Context, u *domain.PlanUnit) error {
	if u == nil {
		return ErrInvalidReservation
	}
	existing, err := l.repo.GetPlanUnitByID(ctx, u.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrPlanUnitNotFound
	}
	// Keep ownership immutable; only mutable display/state fields update.
	existing.UnitNumber = u.UnitNumber
	existing.Zone = u.Zone
	existing.Capacity = u.Capacity
	existing.PositionX = u.PositionX
	existing.PositionY = u.PositionY
	existing.Width = u.Width
	existing.Height = u.Height
	existing.Shape = u.Shape
	existing.IsRentable = u.IsRentable
	existing.Status = u.Status
	return l.repo.UpdatePlanUnit(ctx, existing)
}

// ---------------- Availability ----------------

func (l *Logic) GetAvailability(ctx context.Context, slug string, start, end time.Time) ([]*domain.PlanUnit, error) {
	if !start.Before(end) {
		return nil, ErrInvalidDateRange
	}
	b, err := l.GetBalnearioBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return l.repo.GetAvailableUnits(ctx, b.ID, start, end)
}

// ---------------- Customers ----------------

func (l *Logic) CreateCustomer(ctx context.Context, name, email, phone string) (*domain.Customer, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("customer name is required")
	}
	now := time.Now().UTC()
	c := &domain.Customer{
		ID:        uuid.New(),
		Name:      strings.TrimSpace(name),
		Email:     strings.TrimSpace(email),
		Phone:     strings.TrimSpace(phone),
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := l.repo.CreateCustomer(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (l *Logic) SearchCustomers(ctx context.Context, query string) ([]*domain.Customer, error) {
	return l.repo.SearchCustomers(ctx, strings.TrimSpace(query))
}

// ---------------- Reservations ----------------

// CreateReservation validates the reservation, performs a server-side
// date-overlap conflict check against existing active reservations for the
// same unit, and only then persists it. The DB EXCLUDE constraint is the
// last-resort backstop against races.
func (l *Logic) CreateReservation(ctx context.Context, r *domain.Reservation) (*domain.Reservation, error) {
	if r == nil {
		return nil, ErrInvalidReservation
	}
	if !r.StartDate.Before(r.EndDate) {
		return nil, ErrInvalidDateRange
	}
	if r.GuestCount < 1 {
		return nil, errors.New("guest count must be at least 1")
	}

	// Resolve and validate the unit belongs to the balneario and is rentable.
	unit, err := l.repo.GetPlanUnitByID(ctx, r.UnitID)
	if err != nil {
		return nil, err
	}
	if unit == nil {
		return nil, ErrPlanUnitNotFound
	}
	if unit.BalnearioID != r.BalnearioID {
		return nil, ErrUnitNotInBalneario
	}
	if !unit.IsRentable {
		return nil, ErrUnitNotRentable
	}

	// Server-side conflict check: fetch active reservations for this unit
	// overlapping the requested range and reject on any overlap. We exclude
	// cancelled reservations from blocking new bookings.
	existing, err := l.repo.GetReservationsByUnitAndDateRange(ctx, r.UnitID, r.StartDate, r.EndDate)
	if err != nil {
		return nil, err
	}
	for _, e := range existing {
		if e.Status == domain.ReservationCancelled {
			continue
		}
		if r.ConflictsWith(*e) {
			return nil, ErrReservationConflict
		}
	}

	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	if r.Status == "" {
		r.Status = domain.ReservationPending
	}
	now := time.Now().UTC()
	r.CreatedAt = now
	r.UpdatedAt = now

	if err := l.repo.CreateReservation(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (l *Logic) ListReservations(ctx context.Context, balnearioID *uuid.UUID, status string) ([]*domain.Reservation, error) {
	return l.repo.ListReservations(ctx, balnearioID, status)
}

func (l *Logic) UpdateReservationStatus(ctx context.Context, id uuid.UUID, status string) error {
	switch status {
	case domain.ReservationPending, domain.ReservationConfirmed,
		domain.ReservationCancelled, domain.ReservationCheckedOut:
	default:
		return ErrInvalidStatus
	}
	existing, err := l.repo.GetReservationByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrReservationNotFound
	}
	return l.repo.UpdateReservationStatus(ctx, id, status)
}

// ---------------- Tariffs ----------------

func (l *Logic) ListTariffs(ctx context.Context, balnearioID uuid.UUID) ([]*domain.Tariff, error) {
	return l.repo.ListTariffsByBalneario(ctx, balnearioID)
}

func (l *Logic) CreateTariff(ctx context.Context, t *domain.Tariff) (*domain.Tariff, error) {
	if t == nil {
		return nil, errors.New("tariff is required")
	}
	if strings.TrimSpace(t.UnitType) == "" {
		return nil, errors.New("unit_type is required")
	}
	switch t.Period {
	case domain.PeriodDay, domain.PeriodWeek, domain.PeriodFortnight, domain.PeriodSeason:
	default:
		return nil, errors.New("invalid period")
	}
	if t.Currency == "" {
		t.Currency = "ARS"
	}
	t.ID = uuid.New()
	return t, l.repo.CreateTariff(ctx, t)
}
