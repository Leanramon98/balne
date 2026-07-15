# Indicator Delete Specification

## Purpose

Provide a delete action for indicator values with a confirmation modal, API call, toast notification, and visual feedback returning the indicator to its incomplete state.

## Requirements

### Requirement: Delete Button in Table Row

The system MUST provide a delete button in each indicator table row that triggers a confirmation flow.

#### Scenario: Delete button visible in row

- GIVEN the indicator table is loaded
- WHEN a row renders
- THEN a delete button (trash icon) SHALL be visible
- AND clicking it SHALL NOT immediately delete the indicator

#### Scenario: Delete button disabled for non-draft evaluations

- GIVEN the evaluation is NOT in Borrador or En curso state
- WHEN the indicator table renders
- THEN the delete button SHALL be disabled or hidden for all indicator rows

### Requirement: Confirmation Modal

The system MUST show a confirmation modal before deleting an indicator value.

#### Scenario: Confirmation modal appears

- GIVEN the user clicks the delete button on an indicator row
- WHEN the action is triggered
- THEN a modal SHALL appear with the message "¿Está seguro de eliminar el valor del indicador X?" where X is the indicator name

#### Scenario: Cancel deletion

- GIVEN the confirmation modal is displayed
- WHEN the user clicks "Cancelar"
- THEN the modal SHALL close
- AND no API call SHALL be made
- AND the indicator table SHALL remain unchanged

### Requirement: API Call to Delete

The system MUST call the deleteIndicatorValue API endpoint when deletion is confirmed.

#### Scenario: Successful deletion

- GIVEN the user confirms deletion in the modal
- WHEN the API call succeeds
- THEN a success toast SHALL appear
- AND the indicator row SHALL update to show the indicator as incomplete (Cumplimentado = X)

#### Scenario: Failed deletion

- GIVEN the user confirms deletion in the modal
- WHEN the API call fails
- THEN an error toast SHALL appear with the error message
- AND the indicator row SHALL remain unchanged

### Requirement: Visual Feedback

The system MUST show the indicator returning to its incomplete state after deletion.

#### Scenario: Indicator becomes incomplete

- GIVEN an indicator value was successfully deleted
- WHEN the table updates
- THEN the Cumplimentado column SHALL show "X" (not completed)
- AND the Valor destino column SHALL show a blank or placeholder value
- AND the scope progress counter SHALL decrement
