# admin-config-roles Specification

## Purpose

Replace raw role IDs in the admin configuration users table with human-readable role display names, making it immediately clear what permission level each user holds.

## Requirements

### Requirement: Role display names constant

The system MUST export a constant `ROLE_LABELS` mapping role IDs to human-readable display names, and a utility function `getRoleLabel(roleId)` to resolve a single role ID.

#### Scenario: Known role ID returns display name

- GIVEN a role ID `'admin'`
- WHEN `getRoleLabel('admin')` is called
- THEN it MUST return a display name such as `'Administrador'` or the localized equivalent

#### Scenario: Unknown role ID returns the raw ID

- GIVEN a role ID `'unknown_role'` that has no entry in `ROLE_LABELS`
- WHEN `getRoleLabel('unknown_role')` is called
- THEN it MUST return the raw `'unknown_role'` string

#### Scenario: Missing role ID returns dash

- GIVEN a role ID that is `null` or `undefined`
- WHEN `getRoleLabel(null)` is called
- THEN it MUST return `'-'`

### Requirement: Admin users table displays role names

The system MUST use the role label utility in the `UsersTab` component at `app/(admin)/configuracion/page.tsx` to display the human-readable role name in the "Rol" column.

#### Scenario: Users table shows role display name

- GIVEN the admin users table is rendered with a user whose `RoleID` is `'admin'`
- WHEN the "Rol" column cell renders
- THEN it MUST display the resolved role display name (e.g. `'Administrador'`)

#### Scenario: Users table shows raw ID for unmapped role

- GIVEN the admin users table is rendered with a user whose `RoleID` is not in `ROLE_LABELS`
- WHEN the "Rol" column cell renders
- THEN it MUST display the raw `RoleID` value

#### Scenario: Users table shows dash for absent role

- GIVEN the admin users table is rendered with a user who has no `RoleID` or `roleId`
- WHEN the "Rol" column cell renders
- THEN it MUST display `'-'`
