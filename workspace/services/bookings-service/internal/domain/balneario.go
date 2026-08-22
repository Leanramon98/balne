package domain

import (
	"time"

	"github.com/google/uuid"
)

// Balneario is the venue aggregate root for the bookings domain.
// It owns plan units, tariffs, customers and reservations scoped to it.
type Balneario struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Location  string    `json:"location"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
