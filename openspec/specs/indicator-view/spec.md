# Indicator View Specification

## Purpose

Provide a read-only view of all indicator data using the same layout as the editor, with all sections rendered as text instead of input fields.

## Requirements

### Requirement: Read-Only Layout

The system MUST render the indicator view with the same layout and sections as the editor (HU-10) but ALL sections MUST be read-only.

#### Scenario: View shows classification breadcrumb

- GIVEN the user navigates to the indicator view page
- WHEN the page loads
- THEN the classification breadcrumb SHALL render: Eje (code+name) > Ámbito (name) > Requisito (code+name) > Indicador (code+name)
- AND each level SHALL be displayed as text, not as links (except Ámbito which MAY navigate back)

#### Scenario: View shows description section

- GIVEN the indicator view loads
- WHEN the description section renders
- THEN the requirement description SHALL display as plain text
- AND the indicator description SHALL display as plain text
- AND the criteria/range grid SHALL display with visual indicators showing the current value's position

### Requirement: Read-Only Destination Values

The system MUST display destination section data as text, not input fields.

#### Scenario: Destination values as text

- GIVEN the indicator view loads
- WHEN the destination section renders
- THEN Valor actual SHALL display as text, not a dropdown
- AND Meta SHALL display as text
- AND Fecha meta SHALL display as formatted date text
- AND Observations SHALL display as text
- AND the progress bar SHALL render as visual indicator (non-interactive)
- AND linked actions SHALL display as a read-only list

#### Scenario: Promoted value displays source

- GIVEN the indicator value was copied from a previous evaluation
- WHEN the destination section renders
- THEN "Valor proveniente de [source]" SHALL display as text
- AND the source value SHALL be visible

### Requirement: Read-Only Evaluator Section

The system MUST display evaluator section data as text.

#### Scenario: Evaluator values as text

- GIVEN the indicator view loads
- WHEN the evaluator section renders
- THEN Valor actual evaluador SHALL display as text
- AND previous evaluation value SHALL display as text
- AND Observaciones del evaluador SHALL display as text
- AND Verificado status SHALL show a checkmark or text with verifier name and datetime

#### Scenario: AI suggestions read-only

- GIVEN the evaluator section renders
- WHEN the AI suggestions area is present
- THEN the suggestions text SHALL display as plain text, not a textarea

#### Scenario: Habilitar edición not shown

- GIVEN the indicator view renders
- WHEN the evaluator section renders
- THEN the "Habilitar edición" checkbox SHALL NOT be present

### Requirement: Read-Only AI Analysis

The system MUST display the AI analysis result as text.

#### Scenario: AI analysis result displayed

- GIVEN the indicator has an AI analysis result
- WHEN the destination section renders
- THEN the AI analysis text SHALL display without an "Analizar con IA" button

#### Scenario: No AI analysis available

- GIVEN the indicator has no AI analysis result
- WHEN the destination section renders
- THEN the AI analysis section SHALL show "Sin análisis disponible"
- AND no button to trigger analysis SHALL be present

### Requirement: Read-Only History and Messages

The system MUST display history and messages sections in read-only mode.

#### Scenario: History section read-only

- GIVEN the indicator has previous values
- WHEN the history section renders
- THEN the list of previous values SHALL display as formatted text

#### Scenario: Messages section read-only

- GIVEN the indicator messages section renders
- WHEN the view loads
- THEN messages SHALL display in chronological order
- AND the send message input SHALL NOT be present
- AND messages SHALL be read-only

#### Scenario: No edit buttons present

- GIVEN the indicator view loads
- WHEN the page renders
- THEN no "Guardar" or edit buttons SHALL be present anywhere on the page
- AND the "Anterior" and "Siguiente" navigation buttons SHALL still be visible for navigating between indicators

### Requirement: Loading State

The system MUST show a loading skeleton while fetching indicator data.

#### Scenario: Skeleton during data fetch

- GIVEN the user navigates to the indicator view page
- WHEN data is being fetched
- THEN a skeleton placeholder SHALL render matching the view layout sections
