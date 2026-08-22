package domain

import "errors"

// Sentinel business errors shared across the bookings domain. Inbound
// adapters map these to stable HTTP status codes; use cases return them
// directly so errors.Is keeps working across the port boundary.
var (
	ErrBalnearioNotFound   = errors.New("balneario not found")
	ErrPlanUnitNotFound    = errors.New("plan unit not found")
	ErrCustomerNotFound    = errors.New("customer not found")
	ErrReservationNotFound = errors.New("reservation not found")
	ErrReservationConflict = errors.New("reservation conflicts with an existing booking")
	ErrInvalidDateRange    = errors.New("start date must be before end date")
	ErrInvalidReservation  = errors.New("invalid reservation")
	ErrUnitNotInBalneario  = errors.New("plan unit does not belong to balneario")
	ErrUnitNotRentable     = errors.New("plan unit is not rentable")
	ErrInvalidStatus       = errors.New("invalid status")
	ErrInvalidSlug         = errors.New("invalid slug")
)
