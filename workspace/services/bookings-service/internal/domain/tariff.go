package domain

import "github.com/google/uuid"

// Tariff period values.
const (
	PeriodDay       = "day"
	PeriodWeek      = "week"
	PeriodFortnight = "fortnight"
	PeriodSeason    = "season"
)

// Tariff is the price for renting a unit type over a period during a season.
type Tariff struct {
	ID          uuid.UUID `json:"id"`
	BalnearioID uuid.UUID `json:"balneario_id"`
	UnitType    string    `json:"unit_type"`
	Period      string    `json:"period"`
	Price       float64   `json:"price"`
	Currency    string    `json:"currency"`
	Season      string    `json:"season"`
}
