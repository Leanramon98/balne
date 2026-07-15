# admin-delete-actions Specification

## Purpose

Provide delete actions on admin configuration tables (Destinos, Ejes, Ámbitos, Requisitos, Indicadores) and fix the route group for `/configuracion` and `/perfil` so they render inside the DTI sidebar layout instead of switching to AppShell.

## Requirements

### Requirement: Route group fix for DtiShell consistency

The system MUST move `/configuracion` and `/perfil` from the `app/(admin)/` route group to `app/(dti)/` so these pages inherit `DtiShell` layout (same sidebar as Evaluaciones, Acciones, etc.).

#### Scenario: Configuración renders with DtiShell

- GIVEN the user is on any DTI page (e.g. Evaluaciones)
- WHEN the user navigates to `/configuracion`
- THEN the page SHALL render inside the DtiShell sidebar layout
- AND the sidebar SHALL NOT switch to AppShell

#### Scenario: Perfil renders with DtiShell

- GIVEN the user is on any DTI page
- WHEN the user navigates to `/perfil`
- THEN the page SHALL render inside the DtiShell layout

### Requirement: SDK-only delete — Destinos and Ejes

The system MUST expose `deleteDestination(id)` and `deleteAxis(id)` in the frontend SDK and add a Trash2 delete button to DestinationsConfig and EjesConfig tables. The backend already supports `DELETE /destinations/:id` and `DELETE /admin/axes/:id`.

#### Scenario: DestinationsConfig delete button

- GIVEN the DestinationsConfig table is loaded with destinations
- WHEN a user clicks the Trash2 icon on a destination row
- THEN the SDK SHALL call `DELETE /destinations/:id`
- AND the table SHALL refresh via `mutate()` after success

#### Scenario: EjesConfig delete button

- GIVEN the EjesConfig table is loaded with axes
- WHEN a user clicks the Trash2 icon on an axis row
- THEN the SDK SHALL call `DELETE /admin/axes/:id`
- AND the table SHALL refresh via `mutate()` after success

### Requirement: Full-stack DELETE — Ámbitos, Requisitos, Indicadores

The system MUST add backend `DELETE /admin/scopes/:id`, `DELETE /admin/requirements/:id`, and `DELETE /admin/indicators/:id` endpoints, their SDK delete functions, and Trash2 delete buttons in ScopesConfig, RequirementsConfig, and IndicatorsConfig tables.

#### Scenario: Backend DELETE returns 204 on success

- GIVEN a valid UUID of an existing scope/requirement/indicator
- WHEN `DELETE /admin/scopes/:id` (or requirements/:id, indicators/:id) is called
- THEN the backend SHALL return HTTP 204 No Content
- AND the row SHALL be deleted from the database

#### Scenario: Backend DELETE returns 404 for missing ID

- GIVEN a UUID that does not exist in the table
- WHEN the DELETE endpoint is called with that ID
- THEN the backend SHALL return HTTP 404

#### Scenario: Backend DELETE returns 409 on FK constraint

- GIVEN a scope/requirement/indicator that is referenced by other rows
- WHEN the DELETE endpoint is called
- THEN the backend SHALL return HTTP 409 Conflict
- AND the row SHALL NOT be deleted

#### Scenario: Frontend delete button removes row and refreshes

- GIVEN a scope/requirement/indicator config table is loaded
- WHEN the user clicks the Trash2 icon on a row
- THEN the SDK SHALL call the corresponding DELETE endpoint
- AND the table SHALL refresh via `mutate()` showing the row removed

### Requirement: Delete follows existing catalog pattern

The system MUST follow the same catalog DELETE pattern used by `deleteSubnationalLevel`: parse UUID from param, call repo delete, return 204.

#### Scenario: Handler structure matches existing pattern

- GIVEN `HandleDeleteScope`, `HandleDeleteRequirement`, `HandleDeleteIndicator`
- WHEN the handler parses `c.Param("id")` as UUID
- THEN on invalid UUID it SHALL return 400
- AND on success it SHALL return 204 NoContent
- AND on error it SHALL return 500
