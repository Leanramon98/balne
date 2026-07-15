# Evaluation Form Specification

## Purpose

Provide create and edit forms for evaluations with client-side type selection rules enforced by promotion hierarchy and external evaluator option for Medición Espontánea.

## Requirements

### Requirement: Create Evaluation Form

The system MUST provide a create form with fields: Nombre, Tipo, Fecha desde, Fecha hasta.

#### Scenario: Create new evaluation with valid data

- GIVEN the user is on the create evaluation page
- WHEN the user fills all required fields with valid data and submits
- THEN the system SHALL create the evaluation via API
- AND redirect to the evaluation list with a success toast

#### Scenario: Create with missing required fields

- GIVEN the user is on the create evaluation page
- WHEN the user submits without filling required fields (Nombre, Tipo)
- THEN the form SHALL display validation errors
- AND the API call SHALL NOT be made

### Requirement: Type Selection Rules

The system MUST enforce type selection rules client-side: Diagnóstico only available from closed Autodiagnóstico, Auditoría only from closed Diagnóstico, Medición Espontánea may be independent or from any closed type.

#### Scenario: Diagnóstico requires closed Autodiagnóstico

- GIVEN there is no closed Autodiagnóstico evaluation for the destination
- WHEN the user opens the Tipo dropdown
- THEN Diagnóstico SHALL appear as disabled with a tooltip explaining the requirement

#### Scenario: Medición Espontánea always available

- GIVEN the user is creating a new evaluation
- WHEN the user opens the Tipo dropdown
- THEN Medición Espontánea SHALL always be selectable regardless of other evaluations

#### Scenario: Auditoría requires closed Diagnóstico

- GIVEN there is no closed Diagnóstico evaluation for the destination
- WHEN the user opens the Tipo dropdown
- THEN Auditoría SHALL appear as disabled with a tooltip

### Requirement: Backend Type Selection Validation

The backend `POST /api/evaluations/evaluations` MUST validate the type against existing evaluations for the same destination. Rules: Autodiagnóstico always allowed; Diagnóstico only if a closed Autodiagnóstico exists for the destination; Auditoría only if a closed Diagnóstico exists; Medición Espontánea always allowed.

#### Scenario: Diagnóstico rejected without closed Autodiagnóstico

- GIVEN no Autodiagnóstico exists for the destination
- WHEN POST with `tipo: "diagnostico"`
- THEN response SHALL be 422 with error `promotion_required.diagnostico`

#### Scenario: Auditoría rejected without closed Diagnóstico

- GIVEN no closed Diagnóstico exists for the destination
- WHEN POST with `tipo: "auditoria"`
- THEN response SHALL be 422 with error `promotion_required.auditoria`

#### Scenario: Autodiagnóstico always allowed

- GIVEN any destination state
- WHEN POST with `tipo: "autodiagnostico"`
- THEN evaluation SHALL be created successfully

#### Scenario: Medición Espontánea always allowed

- GIVEN any destination state
- WHEN POST with `tipo: "medicion_espontanea"`
- THEN evaluation SHALL be created successfully

### Requirement: External Evaluator Option

The system MUST show a "Tiene evaluador externo" checkbox when Medición Espontánea is selected.

#### Scenario: External evaluator checkbox visible

- GIVEN the user selects Medición Espontánea as the type
- WHEN the form renders
- THEN a "Tiene evaluador externo" checkbox SHALL be visible

#### Scenario: External evaluator checkbox hidden for other types

- GIVEN the user selects a type other than Medición Espontánea
- WHEN the form renders
- THEN the "Tiene evaluador externo" checkbox SHALL NOT be visible

### Requirement: Edit Evaluation Form

The system MUST provide an edit form allowing changes to Nombre and dates only.

#### Scenario: Edit evaluation name and dates

- GIVEN the user is on the edit evaluation page for an existing evaluation
- WHEN the user changes the name or dates and submits
- THEN the system SHALL update the evaluation via API
- AND show a success toast

#### Scenario: Edit form prevents type change

- GIVEN the user is on the edit evaluation page
- WHEN the form renders
- THEN the Tipo field SHALL be read-only and display the current type

### Requirement: Read-Only Origin Evaluation Field

The system MUST display a read-only "Evaluación origen" field when the evaluation was promoted from another evaluation.

#### Scenario: Promoted evaluation shows origin

- GIVEN the evaluation has a PromotedFromID
- WHEN the edit form renders
- THEN a read-only "Evaluación origen" field SHALL display the source evaluation name

#### Scenario: Non-promoted evaluation hides origin

- GIVEN the evaluation has no PromotedFromID
- WHEN the edit form renders
- THEN the "Evaluación origen" field SHALL NOT be displayed
