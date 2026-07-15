# Audit Log Specification

## Purpose

Application-level audit system capturing every user action (login, CRUD, password ops, profile changes) with full context — IP address, timestamps, old/new value diffs — surfaced through a filterable, paginated UI with PII redaction.

## Requirements

### Requirement: Capture Audit Events

The system MUST create an audit entry for each tracked user action. Entries are append-only (no update, no delete).

| Action | Trigger | OldValue | NewValue | PII Redaction |
|--------|---------|----------|----------|---------------|
| `user.login` | PostAuthLogin success | — | — | — |
| `user.create` | PostUsers creates user | — | Full new user | `password_hash` → `[REDACTED]` |
| `user.update` | UpdateUser persists | Full pre-update user | Full post-update user | `password_hash` in both |
| `user.delete` | DeleteUser deletes | Full deleted user | — | `password_hash` in old |
| `user.password_change` | Password change in session | — | — | Never stores password |
| `user.password_reset` | Reset via recovery flow | — | — | Never stores password |
| `user.password_restore` | Admin restores password | — | — | Never stores password |
| `profile.update` | PutProfile saves | Full pre-profile | Full post-profile | — |

Redacted fields: `password_hash`, `password`, `token_hash`, `recovery_token` — replaced with `[REDACTED]` before JSONB storage.

Audit save failures MUST NOT block the triggering operation (fire-and-forget: log error, continue).

#### Scenario: Login creates audit entry

- GIVEN a user authenticates successfully
- WHEN PostAuthLogin completes
- THEN an audit entry SHALL be saved with action `user.login`, `changed_by` = user ID, `changed_at` = now, `ip_address` = client IP

#### Scenario: User update captures old vs new diff

- GIVEN an admin changes user email from `old@test.com` to `new@test.com`
- WHEN UpdateUser persists
- THEN `old_value` SHALL contain the pre-update user with `password_hash: "[REDACTED]"`
- AND `new_value` SHALL contain the post-update user with `password_hash: "[REDACTED]"`
- AND the frontend diff SHALL highlight email as changed

#### Scenario: User delete stores deleted data

- GIVEN an admin deletes user ID `usr-123`
- WHEN DeleteUser completes
- THEN `old_value` SHALL contain the full user record (password_hash redacted)
- AND `new_value` SHALL be null

### Requirement: Filter and Paginate Audit Logs

`GET /api/audit-logs` MUST support server-side filtering, sorting, and pagination.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `entity_type` | string | — | `user`, `profile`, `auth` |
| `action` | string | — | e.g. `user.update`, `user.login` |
| `changed_by` | string | — | User ID or email substring |
| `from` / `to` | ISO 8601 | — | `changed_at` range |
| `search` | string | — | Free-text across entity fields |
| `limit` | int | 50 | Max items per page |
| `offset` | int | 0 | Pagination offset |
| `sort_by` | string | `changed_at` | Sort column |
| `sort_order` | string | `desc` | `asc` or `desc` |

Response: `{ items: AuditLog[], total: int, limit: int, offset: int }`

Errors: `401` (unauthorized), `400` (invalid params).

#### Scenario: Filter by action and date range

- GIVEN audit entries spanning 30 days
- WHEN `GET /api/audit-logs?action=user.update&from=2026-06-01T00:00:00Z&to=2026-06-30T23:59:59Z`
- THEN the response SHALL return only `user.update` entries within that range, newest first

#### Scenario: Search by email

- GIVEN entries exist for `juan@test.com`
- WHEN `GET /api/audit-logs?search=juan`
- THEN matching entries SHALL be returned (email appears in `changed_by` or entity data)

#### Scenario: PII redaction verified in API response

- GIVEN an audit entry with `old_value` containing user data
- WHEN queried via `GET /api/audit-logs`
- THEN `password_hash`, `password`, `token_hash`, `recovery_token` SHALL be `"[REDACTED]"` in both `old_value` and `new_value`

### Requirement: Frontend Audit Logs Table

The UI SHALL display server-paginated, filterable audit logs. Default: 50 entries, newest first.

Filters: action type dropdown, entity type dropdown, date range picker, changed-by text input, free-text search.

UPDATE rows SHALL show an expandable OldValue vs NewValue diff with changed fields highlighted and unchanged fields dimmed.

Pagination controls SHALL appear when `total > limit`.

The "Exportar" button SHALL remain disabled with tooltip "Próximamente disponible".

#### Scenario: Default view shows newest 50

- GIVEN more than 50 audit entries exist
- WHEN the Access History page loads
- THEN 50 entries SHALL render ordered by `changed_at DESC`
- AND pagination controls SHALL appear

## Data Schema

```sql
CREATE TABLE auditlog (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id   VARCHAR(255),
    action      VARCHAR(100) NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    changed_by  VARCHAR(255) NOT NULL,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address  VARCHAR(45)
);
CREATE INDEX idx_auditlog_entity   ON auditlog(entity_type, action, changed_at DESC);
CREATE INDEX idx_auditlog_user     ON auditlog(changed_by);
CREATE INDEX idx_auditlog_time     ON auditlog(changed_at DESC);
```

Migration: `old_value`/`new_value` from `TEXT` to `JSONB` via `ALTER COLUMN … TYPE JSONB USING old_value::JSONB`. Invalid JSON rows (none expected) default to `'{}'::jsonb`.

## Non-Goals

- Real-time streaming (WebSocket)
- CSV/PDF export (button stays disabled)
- Retention cleanup job (policy: 90 days, configured via `AUDIT_LOG_RETENTION_DAYS` env var)
- Cross-service audit events (evaluations-service is separate)
- Failed login tracking
- Audit log deletion or modification (append-only design)
