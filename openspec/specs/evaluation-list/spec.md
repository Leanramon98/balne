# Evaluation List Specification

## Purpose

Provide a filtered, paginated list of evaluations with role-based access control, inline actions per row, and toast notifications on action results.

## Requirements

### Requirement: List Evaluations with Role-Based Scoping

The system MUST display a filtered, paginated list of evaluations where the backend automatically applies scoping rules based on the user's JWT role. The frontend `destination_id` filter is OPTIONAL for all roles — the backend ignores it for non-admin roles and forces the correct scope. The `destination_id` from JWT context (`c.Get("destination_id")`) is the SOURCE OF TRUTH for destination-bound roles.

(Prologue: previously the spec distinguished only ADMIN vs Non-ADMIN with a simple destination filter — now it uses a full role matrix.)

| Role | scope source | filter applied to SQL | can create? | eval types |
|------|-------------|----------------------|-------------|------------|
| admin | no filter — all destinations | none (ignores destination_id from frontend) | sí | all |
| admin_destino | `destination_id` from JWT | `destination_id = <JWT destination_id>` (ignores frontend param) | sí | all |
| gestor_destino | `destination_id` from JWT | `destination_id = <JWT destination_id>` (ignores frontend param) | sí | all |
| consultor | `evaluation_user` table | `evaluation.id IN (SELECT evaluation_id FROM evaluation_user WHERE user_id = <JWT user_id>)` | no | A/D |
| auditor | `evaluation_user` table | same as consultor | no | auditoría |
| gestor_regional | `region_id` from destination | `destination_id IN (SELECT id FROM destination WHERE region_id = <region from JWT>)` | no | all |
| gestor_nacional | all destinations | none (read-only) | no | all |

#### Scenario: ADMIN sees all evaluations

- GIVEN the current user has role `admin` in the JWT
- WHEN `GET /evaluations` is called with any `destination_id`
- THEN the backend SHALL ignore the query param `destination_id` entirely
- AND return all evaluations matching type/status/pagination filters
- AND the frontend SHALL show a destination selector dropdown

#### Scenario: admin_destino sees only own destination

- GIVEN the current user has role `admin_destino` and JWT contains `destination_id`
- WHEN `GET /evaluations` is called with a different `destination_id` in query
- THEN the backend SHALL force `destination_id = <JWT destination_id>` regardless of the query param
- AND return only evaluations for that destination

#### Scenario: admin_destino has no destination assigned

- GIVEN the current user has role `admin_destino` but JWT has NO `destination_id`
- WHEN `GET /evaluations` is called
- THEN the backend SHALL return an empty list (`total: 0`, `data: []`)

#### Scenario: gestor_destino sees only own destination

- GIVEN the current user has role `gestor_destino` with `destination_id` in JWT
- WHEN `GET /evaluations` is called
- THEN the backend SHALL force `destination_id = <JWT destination_id>`

#### Scenario: consultor sees only explicitly assigned evaluations (A/D)

- GIVEN the current user has role `consultor`
- WHEN `GET /evaluations` is called
- THEN the backend SHALL query `evaluation_user` for the user's user_id
- AND SHALL return only evaluations where the user has any access_level AND evaluation type is `autodiagnostico` or `diagnostico`
- AND the backend SHALL ignore any `destination_id` query param
- AND the destination selector SHALL NOT be displayed in the frontend

#### Scenario: auditor sees only explicitly assigned evaluations (auditoría)

- GIVEN the current user has role `auditor`
- WHEN `GET /evaluations` is called
- THEN the backend SHALL query `evaluation_user` for the user's user_id
- AND SHALL return only evaluations of type `auditoria` where the user has any access_level
- AND SHALL ignore any `destination_id` query param

#### Scenario: gestor_regional sees destinations in their region only

- GIVEN the current user has role `gestor_regional` and JWT contains `region_id`
- WHEN `GET /evaluations` is called
- THEN the backend SHALL find all `destination.id` where `destination.region_id = <JWT region_id>`
- AND SHALL return evaluations only for those destinations

#### Scenario: gestor_regional with destination that has no region

- GIVEN the current user has role `gestor_regional` and JWT has `region_id`
- WHEN the destination records have `region_id = NULL` (no region assigned)
- THEN those destinations SHALL NOT appear in any regional scope
- AND the evaluation list SHALL be empty for unassigned destinations

#### Scenario: gestor_nacional sees all destinations (read-only)

- GIVEN the current user has role `gestor_nacional`
- WHEN `GET /evaluations` is called
- THEN the backend SHALL NOT apply any destination filter
- AND return all evaluations matching type/status/pagination

#### Scenario: Unrecognized role defaults to empty scoping

- GIVEN the current user has a role NOT listed in the scoping matrix
- WHEN `GET /evaluations` is called
- THEN the backend SHALL return an empty list (`total: 0`, `data: []`)

#### Scenario: Filter by type and status

- GIVEN the evaluation list is loaded
- WHEN the user selects a filter value for type or status
- THEN the list SHALL update to show only evaluations matching the selected filters
- AND multiple filters SHALL combine with AND logic

### Requirement: Display Evaluation Table

The system MUST display evaluation data in a table with columns: Nombre, Tipo, Estado, Fecha desde, Fecha hasta, Tipo de miembro, Creada por, Acciones.

#### Scenario: Table renders with all columns

- GIVEN evaluations exist for the current destination
- WHEN the list page loads
- THEN a table SHALL render with all specified columns
- AND each row SHALL show the corresponding evaluation data

#### Scenario: Empty list state

- GIVEN no evaluations exist for the current destination and filter combination
- WHEN the list loads
- THEN a message SHALL indicate no evaluations found
- AND the table header SHALL still be visible

### Requirement: Row Actions by Role

The system MUST show contextual action buttons per row based on user role and evaluation state: Ver, Editar, Cambiar estado, Promover, Anular, Eliminar (solo Borrador).

#### Scenario: ADMIN sees all actions for draft evaluation

- GIVEN the evaluation is in Borrador state
- AND the current user is ADMIN
- WHEN the row renders
- THEN all action buttons SHALL be visible including Eliminar

#### Scenario: Non-ADMIN user sees limited actions

- GIVEN the evaluation is in En curso state
- AND the current user is NOT ADMIN
- WHEN the row renders
- THEN the Eliminar button SHALL NOT be visible
- AND Ver and Editar SHALL be visible

#### Scenario: Delete hidden for non-draft evaluations

- GIVEN the evaluation is NOT in Borrador state
- WHEN the row renders
- THEN the Eliminar button SHALL NOT be visible regardless of role

### Requirement: Backend Pagination with Limit/Offset

The backend `GET /api/evaluations/evaluations` MUST accept `limit` (default 20) and `offset` (default 0) query parameters. The response MUST return `{ data: [...], total: int, limit: int, offset: int }`. Results MUST be ordered by `created_at DESC`.

#### Scenario: Paginated slice returned

- GIVEN 50 evaluations exist
- WHEN GET `/api/evaluations/evaluations?limit=10&offset=0`
- THEN response SHALL contain `data` with 10 items, `total: 50`, `limit: 10`, `offset: 0`

#### Scenario: Defaults when params omitted

- WHEN GET `/api/evaluations/evaluations` without params
- THEN `limit` SHALL default to 20, `offset` to 0

#### Scenario: Order newest-first

- GIVEN evaluations with varying `created_at`
- WHEN any paginated request succeeds
- THEN items in `data` SHALL be ordered newest-first

### Requirement: Frontend Pagination Controls

The frontend SHALL display pagination controls below the evaluation table showing page numbers and Previous/Next buttons when `total > limit`.

#### Scenario: Controls render and navigate

- GIVEN total > limit
- WHEN list page loads
- THEN pagination controls SHALL be visible with page numbers
- AND clicking page 2 SHALL reload with `offset=limit`

### Requirement: Toast Notifications on Actions

The system MUST display a toast notification after every action (create, update, status change, delete).

#### Scenario: Successful action shows success toast

- GIVEN the user performs an action on an evaluation
- WHEN the API call succeeds
- THEN a success toast SHALL appear with a descriptive message

#### Scenario: Failed action shows error toast

- GIVEN the user performs an action on an evaluation
- WHEN the API call fails
- THEN an error toast SHALL appear with the error message

### Requirement: Repository — FindDestinationsByRegionID

The repository MUST provide a method to fetch destination IDs by region.

#### Scenario: Destinations found by region

- GIVEN destinations exist with `region_id = X`
- WHEN `FindDestinationsByRegionID(ctx, "region-X-uuid")` is called
- THEN it SHALL return all destinations with that region_id

### Requirement: Repository — FindEvaluationsByDestinationIDs (modify FindEvaluations)

The existing `FindEvaluations` method signature MUST be extended to accept a slice of destination IDs instead of a single string. This supports admin_destino (single dest), gestor_regional (multiple dests from region), and consultor/auditor (no destination filter — evaluation_user based).

#### Scenario: Backward compatibility for single destination

- GIVEN existing callers pass a single destination_id
- WHEN `FindEvaluations(ctx, []string{"dest-id"}, ...)` is called
- THEN it SHALL return evaluations for that destination

#### Scenario: Empty destination_ids slice

- GIVEN `destinationIDs` is empty or nil (admin, gestor_nacional)
- WHEN `FindEvaluations(ctx, []string{}, ...)` is called
- THEN the WHERE clause SHALL NOT filter by destination_id

#### Scenario: Multiple destination IDs

- GIVEN `destinationIDs` contains multiple entries (gestor_regional after region lookup)
- WHEN `FindEvaluations(ctx, []string{"dest-a", "dest-b"}, ...)` is called
- THEN the query SHALL use `WHERE destination_id = ANY(...)` or `IN (...)`

### Requirement: Usecase — Role-Based Scoping in HandleListEvaluations

The usecase logic SHALL determine the correct scoping strategy based on `roleFromCtx(c)`, `destinationIDFromCtx(c)`, and `userIDFromCtx(c)` before calling the repository.

#### Scenario: Scoping flow for destination-bound roles

- GIVEN role is `admin_destino`, `gestor_destino`, or `gestor_regional`
- WHEN `HandleListEvaluations` executes
- THEN it SHALL compute the effective destination IDs (single from JWT for admin_destino/gestor_destino, from `FindDestinationsByRegionID` for gestor_regional)
- AND SHALL call `FindEvaluations` with those destination IDs
- AND SHALL ignore the `destination_id` query param from the frontend

#### Scenario: Scoping flow for evaluation_user-bound roles

- GIVEN role is `consultor` or `auditor`
- WHEN `HandleListEvaluations` executes
- THEN it SHALL call `FindEvaluationsByUserID(ctx, userID, evalType, status, limit, offset)` instead of the destination-based query
- AND SHALL filter by type (A/D for consultor, auditoría for auditor)
- AND SHALL ignore `destination_id` query param

### Requirement: Repository — FindEvaluationsByUserID

The repository MUST support fetching evaluations where a user has an explicit entry in `evaluation_user`.

#### Scenario: User has access to multiple evaluations

- GIVEN `evaluation_user` has rows for `user_id = X` with various evaluations
- WHEN `FindEvaluationsByUserID(ctx, userID, "autodiagnostico", "", 20, 0)` is called
- THEN it SHALL return evaluations where `evaluation.id IN (SELECT evaluation_id FROM evaluation_user WHERE user_id = $1)` AND `type = $2`

### Requirement: Frontend — destination_id optional in useEvaluations

The `useEvaluations` hook SHALL make `destination_id` optional. The backend determines the scope — the frontend MAY omit it.

#### Scenario: No destination_id sent

- GIVEN the user is not admin
- WHEN `useEvaluations({})` is called without `destination_id`
- THEN the hook SHALL NOT include `destination_id` in the query string
- AND the backend SHALL apply role-based scoping

#### Scenario: Destination selector only for admin

- GIVEN the current user role is NOT `admin`
- WHEN the evaluation list page loads
- THEN the destination selector dropdown SHALL NOT be displayed
