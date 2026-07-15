# Evaluation Workflow UI Specification

## Purpose

Provide state transition controls for evaluations with confirmation modals before every status change, toast notifications on results, and visual adherence to the defined state machine.

## Requirements

### Requirement: Allowed Transitions in API Response

The backend `GET /api/evaluations/evaluations/:id` MUST include `allowed_transitions: string[]` in the response, computed from the evaluation's current state via the state machine's `AllowedTransitions()` method.

#### Scenario: Transitions included for borrador

- GIVEN evaluation is in `borrador` state
- WHEN GET `/api/evaluations/evaluations/:id`
- THEN response SHALL include `allowed_transitions: ["en_curso", "anulada"]`

#### Scenario: Transitions included for cerrada (terminal)

- GIVEN evaluation is in `cerrada` state
- WHEN GET `/api/evaluations/evaluations/:id`
- THEN `allowed_transitions` SHALL be empty or contain only `anulada`

### Requirement: State Transition Buttons

The system MUST display action buttons for each valid transition from the current evaluation state. Buttons MUST be driven by the `allowed_transitions` field from the API response.

#### Scenario: Transition buttons for Borrador state

- GIVEN the evaluation is in Borrador state
- WHEN the workflow section renders
- THEN a button SHALL be displayed to transition to "En curso"
- AND a button SHALL be displayed to "Anular"
- AND buttons SHALL match `allowed_transitions` from the API

#### Scenario: Transition buttons for En curso state

- GIVEN the evaluation is in En curso state
- WHEN the workflow section renders
- THEN a button SHALL be displayed to transition to "Carga finalizada"
- AND a button SHALL be displayed to "Anular"

#### Scenario: Transition buttons for Cerrada state

- GIVEN the evaluation is in Cerrada state
- WHEN the workflow section renders
- THEN no transition buttons SHALL be displayed (Cerrada is terminal besides Anulada)
- AND the system MAY still show Anular if rules permit

### Requirement: Confirmation Modal

The system MUST show a confirmation modal before every state change. The modal SHALL NOT use browser `confirm()`.

#### Scenario: Confirm state transition

- GIVEN the user clicks a transition button
- WHEN the button is clicked
- THEN a modal dialog SHALL appear describing the action
- AND the modal SHALL have Confirm and Cancel buttons
- AND the API call SHALL only execute on Confirm

#### Scenario: Cancel state transition

- GIVEN the confirmation modal is displayed
- WHEN the user clicks Cancel
- THEN the modal SHALL close
- AND no API call SHALL be made
- AND the evaluation state SHALL remain unchanged

### Requirement: Anular Confirmation

The system MUST require confirmation before setting an evaluation to Anulada, with explicit warning text.

#### Scenario: Confirm anular from any active state

- GIVEN the evaluation is in any active state (Borrador, En curso, Carga finalizada, En evaluación)
- WHEN the user clicks Anular
- THEN a confirmation modal SHALL appear with warning text: "¿Está seguro de anular esta evaluación? Esta acción no se puede deshacer."
- AND the API SHALL only be called on confirmation

### Requirement: Success and Failure Toasts

The system MUST show a success or error toast after every state change attempt.

#### Scenario: Successful state change shows toast

- GIVEN the user confirmed a state transition
- WHEN the API call succeeds
- THEN a success toast SHALL appear with the new state name

#### Scenario: Failed state change shows error toast

- GIVEN the user confirmed a state transition
- WHEN the API call fails (e.g., invalid transition per backend rules)
- THEN an error toast SHALL appear with the error message
- AND the evaluation state SHALL remain unchanged in the UI

### Requirement: State Machine Adherence

The system MUST respect the state machine: Borrador→En curso→Carga finalizada→En evaluación→Cerrada. Any active state may transition to Anulada.

#### Scenario: Invalid transition not shown

- GIVEN the evaluation is in Borrador state
- WHEN the workflow section renders
- THEN the button for "Carga finalizada" SHALL NOT appear
- AND only valid transitions from Borrador SHALL be displayed
