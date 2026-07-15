# display-names Specification

## Purpose

Provide a shared utility library and client-side resolver component to replace all raw UUIDs, axis codes, and opaque identifiers across DTI and Admin surfaces with human-readable names. Consolidates the fallback chain (`_name → truncated UUID → '-'`) into a single importable source of truth.

## Requirements

### Requirement: Display-names utility library

The system MUST provide a shared utility at `lib/display-names.ts` exporting functions for name resolution with a consistent fallback chain.

#### Scenario: Utility returns display name from `_name` field

- GIVEN an object with a `_name` field (e.g. `created_by_name`) and a raw UUID (e.g. `created_by`)
- WHEN the utility is called with the object and the field name
- THEN the utility MUST return the `_name` value
- AND MUST NOT fall back to the truncated UUID

#### Scenario: Utility falls back to truncated UUID when `_name` is missing

- GIVEN an object where the `_name` field is `null` or `undefined`
- WHEN the utility is called
- THEN the utility MUST return the first 8 characters of the raw UUID field

#### Scenario: Utility returns fallback dash when both name and UUID are missing

- GIVEN an object where both `_name` and the raw ID field are `null` or `undefined`
- WHEN the utility is called
- THEN the utility MUST return `'-'`

### Requirement: Axis display labels map

The system MUST export a constant `AXIS_LABELS` mapping axis codes to human-readable display labels, and a function `getAxisLabel(code)` to resolve a single code.

#### Scenario: Known axis code returns display label

- GIVEN an axis code `'gob'`
- WHEN `getAxisLabel('gob')` is called
- THEN it MUST return `'Gobernanza'`

#### Scenario: Unknown axis code returns uppercase code

- GIVEN an axis code `'unknown_code'`
- WHEN `getAxisLabel('unknown_code')` is called
- THEN it MUST return `'UNKNOWN_CODE'`

### Requirement: Requirement name lookup component

The system MUST provide a client-side `<RequirementBadge>` component that accepts a `requirement_id` and displays the associated requirement name by resolving it from a pre-fetched mapping or an API call.

#### Scenario: Component displays requirement name when mapping is available

- GIVEN a `requirement_id` that exists in the fetched mapping
- WHEN the component renders
- THEN it MUST display the requirement name string, not the UUID

#### Scenario: Component shows truncated UUID while loading

- GIVEN a `requirement_id` whose mapping is still being fetched
- WHEN the component renders during loading
- THEN it MUST display the first 8 characters of the UUID

#### Scenario: Component shows truncated UUID on lookup failure

- GIVEN a `requirement_id` that fails to resolve (API error or missing mapping)
- WHEN the component renders the error state
- THEN it MUST display the first 8 characters of the UUID as fallback

### Requirement: Evaluaciones list page uses display-name utility

The system MUST use the display-name utility in `app/(dti)/evaluaciones/page.tsx` to render the `created_by_name` column.

#### Scenario: Table cell shows creator name from utility

- GIVEN an evaluation with `created_by_name` set
- WHEN the "Creada por" cell renders
- THEN it MUST display the full `created_by_name` value via the utility

#### Scenario: Table cell shows truncated UUID when name unavailable

- GIVEN an evaluation where `created_by_name` is `null`
- WHEN the "Creada por" cell renders
- THEN it MUST display the first 8 characters of `created_by`

### Requirement: Evaluaciones detail page shows human-readable names

The system MUST use the display-name utility in `app/(dti)/evaluaciones/[id]/page.tsx` for the `destination_name`, `created_by_name`, and `user_name` fields.

#### Scenario: Detail card shows destination name

- GIVEN an evaluation with `destination_name` set
- WHEN the "Destino" field renders
- THEN it MUST display `destination_name` instead of `destination_id`

#### Scenario: Detail card shows creator name

- GIVEN an evaluation with `created_by_name` set
- WHEN the "Creada por" field renders
- THEN it MUST display `created_by_name` instead of `created_by` UUID

#### Scenario: Access table shows user name

- GIVEN a user with `user_name` set
- WHEN the "Usuario" column renders in the access table
- THEN it MUST display `user_name` instead of the truncated `user_id`

### Requirement: Scope indicators page shows requirement name

The system MUST use the `RequirementBadge` component in `app/(dti)/evaluaciones/[id]/ambitos/[scopeId]/page.tsx` for the two `requirement_id` display locations (table cell and classification badge).

#### Scenario: Indicator table shows requirement name

- GIVEN an indicator with a `requirement_id` that resolves to a known requirement
- WHEN the "Requisito" column cell renders
- THEN it MUST display the requirement name via `RequirementBadge`

#### Scenario: Value editor shows requirement name in badge

- GIVEN an indicator with a `requirement_id` that resolves to a known requirement
- WHEN the classification bar in the value editor dialog renders
- THEN it MUST display the requirement name via `RequirementBadge`

### Requirement: Acciones page shows axis display labels

The system MUST replace raw axis code display in `app/(dti)/acciones/page.tsx` with the `getAxisLabel()` utility.

#### Scenario: Axis cell shows display label for known code

- GIVEN an action with axes `['gob', 'inn']`
- WHEN the "Ejes" column cell renders
- THEN it MUST display `'Gobernanza, Innovación'` (the resolved display labels)

#### Scenario: Axis cell shows dash for empty axes

- GIVEN an action with `axes` being `null` or an empty array
- WHEN the "Ejes" column cell renders
- THEN it MUST display `'-'`

### Requirement: Plan Transformacion page shows indicator name and replaces UUID input

The system MUST use indicator display fields in `app/(dti)/plan-transformacion/page.tsx` and replace the raw UUID text input for adding goals with a searchable `<select>` component.

#### Scenario: Goal card shows indicator name

- GIVEN a goal with `indicator_name` and `indicator_code` set
- WHEN the goal card title renders
- THEN it MUST display `indicator_name` (or `indicator_code` if name is unavailable)

#### Scenario: Add goal dialog uses searchable select

- GIVEN the "Añadir Objetivo" dialog is open
- WHEN the user types in the indicator selector
- THEN the selector MUST show a searchable dropdown of indicators with `indicator_name` and `indicator_code`
- AND MUST NOT show a raw UUID text input

#### Scenario: Searchable select filters by name or code

- GIVEN the searchable select is open with a list of indicators
- WHEN the user types a search query
- THEN the list MUST filter to indicators whose name or code contains the query

#### Scenario: Selected indicator populates the goal form

- GIVEN the user selects an indicator from the searchable select
- WHEN the selection is confirmed
- THEN the `indicator_id` MUST be set for the API call
- AND the display MUST show the selected indicator's name and code

### Requirement: Admin configuracion shows requirement name

The system MUST use the `RequirementBadge` component in `app/(admin)/configuracion/page.tsx` for the `requirement_id` column in the indicators table.

#### Scenario: Indicators table shows requirement name

- GIVEN an indicator with a `requirement_id` that resolves
- WHEN the "Requisito" column cell renders in the admin indicators table
- THEN it MUST display the requirement name via `RequirementBadge` instead of the truncated UUID
