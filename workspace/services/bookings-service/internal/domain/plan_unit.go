package domain

import "github.com/google/uuid"

// PlanUnit shape values.
const (
	ShapeRectangle = "rectangle"
	ShapeCircle    = "circle"
)

// PlanUnit status values.
const (
	UnitAvailable   = "available"
	UnitOccupied    = "occupied"
	UnitHeld        = "held"
	UnitMaintenance = "maintenance"
)

// PlanUnit is a rentable spot on a balneario's plan map.
type PlanUnit struct {
	ID          uuid.UUID `json:"id"`
	BalnearioID uuid.UUID `json:"balneario_id"`
	UnitNumber  string    `json:"unit_number"`
	Zone        string    `json:"zone"`
	Capacity    int       `json:"capacity"`
	PositionX   float64   `json:"position_x"`
	PositionY   float64   `json:"position_y"`
	Width       float64   `json:"width"`
	Height      float64   `json:"height"`
	Shape       string    `json:"shape"`
	IsRentable  bool      `json:"is_rentable"`
	Status      string    `json:"status"`
}
