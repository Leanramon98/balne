package domain

// ResultsData represents aggregated evaluation results for a destination.
type ResultsData struct {
	DestinationID       string             `json:"destination_id"`
	DestinationName     string             `json:"destination_name"`
	Country             string             `json:"country"`
	Typology            string             `json:"typology,omitempty"`
	PopulationRange     string             `json:"population_range,omitempty"`
	TotalIndicators     int                `json:"total_indicators"`
	CompletedIndicators int                `json:"completed_indicators"`
	PercentageByScope   map[string]float64 `json:"percentage_by_scope"`
	PercentageByAxis    map[string]float64 `json:"percentage_by_axis"`
	TotalCompliance     float64            `json:"total_compliance"`
	CompletedByScope    map[string]int     `json:"completed_by_scope"`
	TotalByScope        map[string]int     `json:"total_by_scope"`
}

// ResultsFilters holds optional filter parameters for results queries.
type ResultsFilters struct {
	Year         int
	ScopeID      string
	Axis         string
	Country      string
	TypologyID   string
	MemberTypeID string
	DestinationID string
}
