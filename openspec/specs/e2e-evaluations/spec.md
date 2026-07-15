# E2E Evaluations Specification

## Purpose

Provide a Playwright end-to-end test suite covering the full Evaluaciones DTI user lifecycle — from login through creation, state transitions, actions, promotion, and public page verification. Tests MUST be automated, repeatable, and run against a dedicated test database.

## Requirements

### Requirement: Authentication and Session

The e2e suite MUST authenticate as each relevant role (ADMIN, admin_destino, evaluador, carga) and maintain session across test steps.

#### Scenario: Login as ADMIN

- GIVEN valid ADMIN credentials
- WHEN the login form is submitted
- THEN the user SHALL be redirected to the evaluation list
- AND a session cookie SHALL be set

#### Scenario: Login as non-ADMIN role

- GIVEN valid evaluador credentials
- WHEN the login form is submitted
- THEN the user SHALL be redirected to the evaluation list
- AND the destination selector SHALL NOT appear

### Requirement: Evaluation Lifecycle

The suite MUST cover: create → view → transition states → navigate scopes → view indicators → create actions → promote → verify public page.

#### Scenario: Create evaluation via UI

- GIVEN the user is on the create evaluation form
- WHEN the user fills required fields (Nombre, Tipo, Fecha desde, Fecha hasta) and submits
- THEN the evaluation SHALL be created with state `borrador`
- AND the user SHALL be redirected to the evaluation list
- AND a success toast SHALL appear

#### Scenario: State machine transitions (full path)

- GIVEN an evaluation in `borrador` state
- WHEN the user transitions through each valid state: en_curso → carga_finalizada → en_evaluacion → cerrada
- THEN each transition SHALL succeed
- AND the state badge SHALL update in the UI
- AND a success toast SHALL appear after each

#### Scenario: Anular evaluation

- GIVEN an evaluation in any active state
- WHEN the user clicks Anular and confirms
- THEN the state SHALL change to `anulada`
- AND the UI SHALL reflect the terminal state

#### Scenario: Scope cards display with progress

- GIVEN an evaluation with assigned scopes
- WHEN the scopes section loads
- THEN each scope card SHALL display acronym, name, progress (X/Y), and percentage
- AND cards SHALL be color-coded (amber < 100%, green = 100%)

#### Scenario: View indicators per scope

- GIVEN a scope card is visible
- WHEN the user clicks the card
- THEN the indicators page SHALL load for that scope
- AND the URL SHALL contain evaluation ID and scope ID

#### Scenario: Create action on indicator

- GIVEN the indicators page for a scope
- WHEN the user creates an action with a description
- THEN the action SHALL appear in the indicator's action list
- AND a success toast SHALL appear

#### Scenario: Promote to next evaluation type

- GIVEN an evaluation in `cerrada` state
- AND a higher type is available (e.g., Autodiagnóstico → Diagnóstico)
- WHEN the user promotes the evaluation
- THEN a new evaluation SHALL be created linked to the original
- AND the new evaluation SHALL appear in the list with the higher type

### Requirement: Access Control

The suite MUST verify role-based access controls and admin implicit access.

#### Scenario: Non-ADMIN cannot delete

- GIVEN the user has role `evaluador`
- WHEN viewing an evaluation in `borrador` state
- THEN the Eliminar button SHALL NOT be visible

#### Scenario: ADMIN implicit access displayed

- GIVEN the current evaluation exists
- WHEN an ADMIN user views the access tab
- THEN ADMIN users SHALL appear with "Acceso implícito" badge
- AND no revoke button SHALL appear for implicit entries

#### Scenario: Grant and revoke access

- GIVEN the user is ADMIN
- WHEN the admin grants access to a user
- THEN the user SHALL appear in the access list
- AND when revoked, the row SHALL be removed

### Requirement: Public Good Practices Page

The suite MUST verify the public `/buenas-practicas/` page renders without authentication.

#### Scenario: Public page loads without auth

- GIVEN no auth cookies/tokens
- WHEN navigating to `/buenas-practicas`
- THEN the page SHALL render with HTTP 200
- AND only approved practices SHALL appear
- AND filter controls SHALL work

### Requirement: Test Infrastructure

The suite MUST run against a dedicated test database, be idempotent, use data cleanup, and include retry for async operations.

#### Scenario: Idempotent test setup

- GIVEN the test suite starts
- BEFORE each test, seed data SHALL be prepared
- AFTER each test, test data SHALL be cleaned up
- AND tests SHALL not depend on state from other tests

#### Scenario: Retry flaky transitions

- GIVEN an async state transition
- WHEN the initial assertion fails
- THEN the test SHALL retry up to 3 times with exponential backoff
- AND fail only if all retries are exhausted

