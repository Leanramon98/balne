# Indicator Editor Specification

## Purpose

Provide a full-page editor (not a dialog) for indicator values with six distinct sections: classification breadcrumb, description, destination values, evaluator values, history, and messages. Include AI analysis and previous/next navigation between indicators.

## Requirements

### Requirement: Full-Page Layout

The system MUST render the indicator editor as a full-page view (not a dialog/modal).

#### Scenario: Editor opens as full page

- GIVEN the user clicks Editar on an indicator row
- WHEN the action is triggered
- THEN the system SHALL navigate to a full-page editor URL
- AND the editor SHALL occupy the full viewport width

#### Scenario: Direct URL access

- GIVEN the user navigates directly to the editor URL with a valid evaluation ID, scope ID, and indicator value ID
- WHEN the page loads
- THEN the editor SHALL render with the indicator data

### Requirement: Classification Breadcrumb

The system MUST display a breadcrumb showing the classification hierarchy: Eje (code+name) > Ámbito (name) > Requisito (code+name) > Indicador (code+name).

#### Scenario: Breadcrumb shows hierarchy

- GIVEN the editor loads with indicator data
- WHEN the breadcrumb section renders
- THEN it SHALL display four levels: Eje, Ámbito, Requisito, Indicador
- AND each level SHALL show both code and name as specified

#### Scenario: Breadcrumb links are navigable

- GIVEN the breadcrumb is displayed
- WHEN the user clicks on the Ámbito level
- THEN the system SHALL navigate back to the scope's indicator table

### Requirement: Description Section

The system MUST display the requirement description, indicator description, and criteria/range grid (gradient 0-25-50-75-100% for gradient type, or Sí/No for boolean type).

#### Scenario: Gradient criteria grid renders

- GIVEN the indicator type is "gradient"
- WHEN the description section renders
- THEN a criteria grid SHALL display five levels: 0%, 25%, 50%, 75%, 100%
- AND each level SHALL show the corresponding criteria text

#### Scenario: Boolean criteria grid renders

- GIVEN the indicator type is "boolean"
- WHEN the description section renders
- THEN a criteria grid SHALL display two options: Sí and No
- AND each option SHALL show the corresponding criteria text

### Requirement: Destination Section

The system MUST provide a destination section with: Valor actual dropdown, "Valor proveniente de [source]" when promoted, Meta, Fecha meta, progress bar towards meta, Observations textarea, linked actions list with link/unlink, AI Analysis button and result.

#### Scenario: Destination section renders with all fields

- GIVEN the editor loads with indicator data
- WHEN the destination section renders
- THEN a dropdown SHALL display available values for Valor actual
- AND the Meta and Fecha meta inputs SHALL be editable
- AND a progress bar SHALL show the current value vs meta
- AND an Observations textarea SHALL be present
- AND a linked actions list SHALL display currently linked actions
- AND an "Analizar con IA" button SHALL be present

#### Scenario: Promoted value shows source

- GIVEN the indicator value was copied from a previous evaluation via promotion
- WHEN the destination section renders
- THEN the Valor actual field SHALL display "Valor proveniente de [source evaluation name]"
- AND the dropdown SHALL be read-only

#### Scenario: Link and unlink actions

- GIVEN the destination section renders
- WHEN the user clicks the link button next to an unlinked action
- THEN the API SHALL be called to link the action to the indicator
- AND the actions list SHALL update

- GIVEN an action is linked to the indicator
- WHEN the user clicks the unlink button and confirms
- THEN the API SHALL be called to unlink
- AND the actions list SHALL update

#### Scenario: AI Analysis flow

- GIVEN the destination section is rendered
- WHEN the user clicks "Analizar con IA"
- THEN the system SHALL call the analyze API endpoint
- AND display a loading state while processing
- AND show the AI analysis result text when complete
- AND show an error toast if the analysis fails

### Requirement: Evaluator Section

The system MUST provide an evaluator section with: Valor actual evaluador dropdown, previous evaluation value (readonly), Observaciones del evaluador, Habilitar edición checkbox, Verificado checkbox (auto-records name and datetime).

#### Scenario: Evaluator section for evaluator role

- GIVEN the current user has evaluator or admin role
- WHEN the evaluator section renders
- THEN the Valor actual evaluador dropdown SHALL be visible
- AND the previous evaluation value SHALL be shown as readonly text
- AND the Observaciones del evaluador textarea SHALL be editable
- AND the Habilitar edición checkbox SHALL be present
- AND the Verificado checkbox SHALL be present

#### Scenario: Verificado auto-records metadata

- GIVEN the evaluator section renders
- WHEN the user checks the Verificado checkbox
- THEN the system SHALL auto-record the current user's name and current datetime
- AND display the verification metadata below the checkbox

#### Scenario: Evaluator section hidden for non-evaluator

- GIVEN the current user does NOT have evaluator or admin role
- WHEN the evaluator section renders
- THEN the entire evaluator section SHALL be hidden or read-only

### Requirement: AI Suggestions (Evaluator Only)

The system MUST provide a textarea in the evaluator section for AI improvement suggestions.

#### Scenario: AI suggestions visible to evaluator

- GIVEN the current user has evaluator role
- WHEN the evaluator section renders
- THEN a textarea SHALL be present for "Sugerencias de mejora IA"
- AND it SHALL be editable

#### Scenario: AI suggestions read-only for non-evaluator

- GIVEN the current user has destino role
- WHEN the page renders
- THEN the AI suggestions textarea SHALL NOT be visible or SHALL be read-only

### Requirement: History Section

The system MUST display a history section showing previous evaluation values for the same indicator.

#### Scenario: History shows previous values

- GIVEN the indicator has values from previous evaluations
- WHEN the history section renders
- THEN a list SHALL display each previous value
- AND each entry SHALL show the evaluation name, value, and date

#### Scenario: No history available

- GIVEN the indicator has no previous evaluation values
- WHEN the history section renders
- THEN a message SHALL indicate no history is available

### Requirement: Messages Section

The system MUST display a messages section with a message list and send input, with email notification trigger.

#### Scenario: Messages list renders

- GIVEN the indicator has existing messages
- WHEN the messages section renders
- THEN all messages SHALL be displayed in chronological order
- AND each message SHALL show sender name, text, and timestamp

#### Scenario: Send a new message

- GIVEN the messages section is rendered
- WHEN the user types a message and submits
- THEN the API SHALL be called to create the message
- AND the message SHALL appear in the list
- AND the system SHALL trigger an email notification to involved users

### Requirement: Previous/Next Navigation

The system MUST provide Previous and Next buttons to navigate between indicators within the same scope.

#### Scenario: Navigate to next indicator

- GIVEN the editor is open for an indicator
- WHEN the user clicks "Siguiente"
- THEN the system SHALL navigate to the editor for the next indicator in the scope
- AND any unsaved changes SHALL be discarded (or prompt to save)

#### Scenario: Navigate to previous indicator

- GIVEN the editor is open for an indicator
- WHEN the user clicks "Anterior"
- THEN the system SHALL navigate to the editor for the previous indicator in the scope

#### Scenario: First indicator disables previous

- GIVEN the user is viewing the first indicator in the scope
- WHEN the editor renders
- THEN the "Anterior" button SHALL be disabled

#### Scenario: Last indicator disables next

- GIVEN the user is viewing the last indicator in the scope
- WHEN the editor renders
- THEN the "Siguiente" button SHALL be disabled

### Requirement: Save Indicator Value

The system MUST provide a save mechanism that persists changes to the indicator value via API.

#### Scenario: Save destination values

- GIVEN the user has modified destination fields
- WHEN the user clicks "Guardar"
- THEN the system SHALL call the save indicator value API
- AND show a success toast on completion
- AND show an error toast if the save fails

#### Scenario: Save evaluator values

- GIVEN the user has modified evaluator fields
- WHEN the user clicks "Guardar"
- THEN the system SHALL call the save evaluator value API
- AND show a success toast on completion
