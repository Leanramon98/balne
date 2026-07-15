# Evaluation Scopes Specification

## Purpose

Display all scopes (ámbitos) for an evaluation as a card grid with progress indicators, color coding, and navigation to each scope's indicator page.

## Requirements

### Requirement: Scope Card Grid

The system MUST display all scopes for an evaluation as a grid of cards.

#### Scenario: Scope grid renders with all scopes

- GIVEN the evaluation exists and has scopes assigned
- WHEN the scopes section loads
- THEN a grid of cards SHALL render, one per scope
- AND each card SHALL display the scope's icon, acronym, name, and description

#### Scenario: Empty scopes state

- GIVEN the evaluation has no scopes assigned
- WHEN the scopes section loads
- THEN a message SHALL indicate no scopes are available
- AND the grid SHALL NOT render

### Requirement: Progress Per Card

Each scope card MUST show the number of completed indicators out of total (X/Y) and the percentage. The backend MUST include `percentage` (float64) in the JSON response as the canonical completion field; `completion_percent` MAY remain for backward compatibility.

#### Scenario: Card shows completion metrics

- GIVEN a scope has N total indicators and X completed
- WHEN the card renders
- THEN it SHALL display "X/Y" completed indicators
- AND it SHALL display the completion percentage
- AND a progress bar SHALL show the proportion visually

#### Scenario: Percentage field present in response

- GIVEN scope progress is requested
- WHEN the API returns scope data
- THEN each scope SHALL include `percentage` in the JSON response
- AND its value SHALL equal `completion_percent`

#### Scenario: Scope with zero indicators

- GIVEN a scope has no indicators
- WHEN the card renders
- THEN it SHALL display "0/0" or "Sin indicadores"
- AND the progress SHALL be shown as 0%

### Requirement: Color Coding

The system MUST color-code scope cards: orange/amber if completion is below 100%, green if 100%.

#### Scenario: Incomplete scope is amber

- GIVEN the scope has less than 100% completion
- WHEN the card renders
- THEN the progress bar and percentage SHALL use amber/orange color

#### Scenario: Complete scope is green

- GIVEN the scope has 100% completion
- WHEN the card renders
- THEN the progress bar and percentage SHALL use green color

### Requirement: Navigation to Scope Indicators

The system MUST navigate to the scope indicators page when a scope card is clicked.

#### Scenario: Click navigates to indicator list

- GIVEN the scope card is displayed
- WHEN the user clicks on the card
- THEN the system SHALL navigate to the indicators page for that scope within the evaluation
- AND the URL SHALL include evaluation ID and scope ID

#### Scenario: Click on empty scope card

- GIVEN the scope card shows 0 indicators
- WHEN the user clicks on the card
- THEN the system SHALL navigate to the indicators page
- AND the indicator list SHALL show an empty state
