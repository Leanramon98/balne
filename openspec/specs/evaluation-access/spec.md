# Evaluation Access Specification

## Purpose

Manage user access to evaluations through a tab panel that displays current access list, supports granting and revoking access with four levels, and shows ADMIN as implicit full access.

## Requirements

### Requirement: Display Access List

The system MUST display a tab panel showing the current user access list for an evaluation with columns: Usuario, Perfil, Nivel de acceso, Acciones.

#### Scenario: Access list renders with user data

- GIVEN the evaluation has users with granted access
- WHEN the user navigates to the access tab
- THEN a table SHALL render with columns Usuario, Perfil, Nivel de acceso, Acciones
- AND each row SHALL show the corresponding user's name, role, and access level

#### Scenario: Empty access list

- GIVEN no users have been granted access to the evaluation
- WHEN the access tab loads
- THEN a message SHALL indicate no users have access

### Requirement: Four Access Levels

The system MUST support four access levels: Solo lectura, Carga, Evaluador, Administración.

#### Scenario: Access levels displayed in grant dialog

- GIVEN the user opens the grant access dialog
- WHEN the level selector renders
- THEN all four levels SHALL be available: Solo lectura, Carga, Evaluador, Administración
- AND each SHALL display with its label

### Requirement: Grant Access

The system MUST provide a dialog to grant access with a user search/selector that searches by name, not UUID.

#### Scenario: Grant access to a user

- GIVEN the user opens the grant access dialog
- WHEN the user searches by name, selects a user, chooses an access level, and confirms
- THEN the API SHALL be called to grant access
- AND the access list SHALL update with the new user
- AND a success toast SHALL appear

#### Scenario: Search with no matching users

- GIVEN the grant access dialog is open
- WHEN the user types a search term that matches no users
- THEN the selector SHALL show a "No se encontraron usuarios" message

#### Scenario: Grant access to already-granted user

- GIVEN a user already has access to the evaluation
- WHEN the admin tries to grant access to the same user again
- THEN the API SHALL return a conflict error
- AND an error toast SHALL appear

### Requirement: Revoke Access

The system MUST provide a way to revoke user access with confirmation.

#### Scenario: Revoke access with confirmation

- GIVEN a user has access to the evaluation
- WHEN the admin clicks the revoke button and confirms in the confirmation dialog
- THEN the API SHALL be called to revoke access
- AND the row SHALL be removed from the access list
- AND a success toast SHALL appear

#### Scenario: Cancel revoke

- GIVEN the admin clicks revoke for a user
- WHEN the confirmation dialog is shown and the admin cancels
- THEN no API call SHALL be made
- AND the access list SHALL remain unchanged

### Requirement: ADMIN Implicit Access

The system MUST return ADMIN users as implicit entries in `GET /api/evaluations/:id/users` with `is_implicit: true`, `tipo_acceso: "administracion"`, and `id: null` (not revocable). The frontend MUST show ADMIN users as having implicit full access without displaying them in the grantable users list.

#### Scenario: ADMIN users included as implicit entries

- GIVEN the platform has ADMIN users
- WHEN GET `/api/evaluations/:id/users`
- THEN response SHALL include ADMIN users with `is_implicit: true`
- AND `tipo_acceso` SHALL be `administracion`
- AND `id` SHALL be null (not revocable)

#### Scenario: ADMIN shown as implicit access in UI

- GIVEN the current evaluation has ADMIN users in the platform
- WHEN the access tab loads
- THEN ADMIN users SHALL be displayed with "Administración" level marked as "Acceso implícito"
- AND the revoke action SHALL NOT be shown for implicit ADMIN access

#### Scenario: ADMIN user not in grantable users

- GIVEN the grant access dialog is open
- WHEN the user search returns results
- THEN ADMIN users SHALL NOT appear in the searchable user list
