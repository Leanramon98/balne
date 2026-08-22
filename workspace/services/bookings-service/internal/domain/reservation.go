package domain

import (
	"time"

	"github.com/google/uuid"
)

// Reservation status values.
const (
	ReservationPending    = "pending"
	ReservationConfirmed  = "confirmed"
	ReservationCancelled  = "cancelled"
	ReservationCheckedOut = "checked_out"
)

// Reservation books a plan unit for a customer over a date range.
// The date range is half-open: [StartDate, EndDate).
type Reservation struct {
	ID          uuid.UUID `json:"id"`
	BalnearioID uuid.UUID `json:"balneario_id"`
	UnitID      uuid.UUID `json:"unit_id"`
	CustomerID  uuid.UUID `json:"customer_id"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	GuestCount  int       `json:"guest_count"`
	Status      string    `json:"status"`
	TotalPrice  float64   `json:"total_price"`
	Notes       string    `json:"notes"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ConflictsWith reports whether two reservations overlap on the same unit.
// The overlap test is half-open: [start, end) intersects when
// r.StartDate < other.EndDate AND other.StartDate < r.EndDate.
// Status filtering (e.g. ignoring cancelled) is the caller's responsibility.
func (r Reservation) ConflictsWith(other Reservation) bool {
	if r.UnitID != other.UnitID {
		return false
	}
	return r.StartDate.Before(other.EndDate) && other.StartDate.Before(r.EndDate)
}
