# Exploration: Full Audit Log Tracking System

## Change Name
`audit-log-full-tracking`

## Current State

### Architecture Overview

The system has **two parallel audit mechanisms** that were scaffolded but never completed:

#### 1. Trigger-Based Audit (`user_history` table) — Working for `user` table only
- `init_generated.sql` defines `fn_audit_log()` — a generic PL/pgSQL function that writes to `{table}_history`
- A trigger `trg_audit_user` on `user` table fires AFTER INSERT/UPDATE/DELETE
- Writes to `user_history` table (id, entity_id, operation, old_data JSONB, new_data JSONB, changed_by, changed_at)
- `changed_by` is populated via `current_setting('audit.user_id', true)` — set in `main_generated.go` middleware
- The `handleGetUserHistory` handler in `handlers_generated.go` directly queries `user_history` — this actually WORKS (the only audit code that works)

#### 2. Application-Level Audit (`auditlog` table + AuditLogRepo) — Completely unimplemented
- `AuditLog` domain entity in `domain/entities.go` has: ID, EntityType, EntityID, Action, OldValue(json.RawMessage), NewValue(json.RawMessage), ChangedBy, ChangedAt, IPAddress
- `AuditLogRepository` interface in `ports/out/ports_generated.go`: FindByID, FindAll, Save, Update, Delete
- `AuditLogRepo` struct in `postgres/repository.go` has NO `db` field — ALL methods `panic("not implemented")`
- `logic_audit.go`: `GetAuditLogs` and `GetUserHistory` both `panic("not implemented")`
- `Logic` struct in `logic.go`: NO `auditLog` field, NO `WithAuditLogRepository` option
- `main_generated.go`: `AuditLogRepo` is NOT created, NOT wired into `Logic`
- `init_generated.sql` creates `auditlog` table but with `TEXT` columns for oldvalue/newvalue (should be `JSONB`)

#### 3. Evaluations-Service
- Has `fn_audit_log` function defined in its `init_generated.sql` but NO tables have the trigger applied
- No audit log tables or entities in evaluations-service

### Frontend State

#### AuditLog Generated Type (`types/index_generated.ts`)
```typescript
interface AuditLog {
  ID: string; EntityType: string; EntityID: string;
  Action: string; OldValue: any; NewValue: any;
  ChangedBy: string; ChangedAt: string; IPAddress: string;
}
```

#### AuditLogFilter Type (`types/dti.ts`)
```typescript
interface AuditLogFilter {
  entity_type?: string; action?: string; from?: string;
  to?: string; limit?: number; offset?: number;
}
```

#### API Client (`sdk/api/users-api.ts`)
- `getAuditLogs(params?: AuditLogFilter)` — builds query string, calls `GET /audit-logs`
- Params: entity_type, action, from, to, limit, offset

#### SWR Hook (`sdk/hooks/useAuditLogs.ts`)
- `useAuditLogs(filters?)` — SWR key from JSON-stringified filters, calls `getAuditLogs`
- Returns `{ logs, isLoading, error, mutate }`

#### AuditLogsTable Component (`components/organisms/AuditLogsTable.tsx`)
- Props: `{ logs: Record<string, unknown>[], isLoading: boolean }` — very loose typing
- Columns: Fecha y hora, Perfil, Acción, Detalle
- Basic text search only (client-side filter on all fields)
- Export button is disabled ("Próximamente disponible")
- Shows raw EntityType + EntityID in Detalle column
- No pagination, no structured filters, no diff view, no metadata expansion
- Fallback to `val()` helper that tries PascalCase/camelCase keys (needed because backend returns PascalCase from generated type)

#### AccesosConfig (`components/organisms/config/AccesosConfig.tsx`)
- Simple wrapper: `useAuditLogs()` → `<AuditLogsTable>`
- No filters passed to the hook

#### Dashboard (`sdk/hooks/useDashboardData.ts`)
- Uses `useAuditLogs({ limit: 10 })` for recent activity section
- Uses `ActivitySection` component with a minimal local `AuditLogItem` type

### Route Registration
- `GET /api/audit-logs` → `handleGetAuditLogs` (exists in handers_generated.go)
- `GET /api/user/:id/history` → `handleGetUserHistory` (works, queries user_history directly)

### BFF Proxy (`app/api/[...path]/route.ts`)
- Generic proxy: `/api/users/audit-logs` → gateway → users-service
- No special handling needed — the generic proxy works

## Affected Areas

### Backend — Users Service
| File | Why Affected |
|------|-------------|
| `internal/domain/entities.go` | `AuditLog` entity — OK as-is |
| `internal/ports/out/ports_generated.go` | `AuditLogRepository` — FindAll needs filtering/pagination support |
| `internal/ports/in/ports_generated.go` | `GetAuditLogsRequest` — empty struct, needs filter fields |
| `internal/usecases/logic.go` | Logic struct — needs `auditLog` field + `WithAuditLogRepository` option |
| `internal/usecases/logic_audit.go` | Full implementation of GetAuditLogs with filtering/pagination |
| `internal/usecases/logic_auth.go` | Add audit log on login (PostAuthLogin) |
| `internal/usecases/logic_users.go` | Add audit logs on user CRUD (PostUsers, UpdateUser, DeleteUser) |
| `internal/usecases/logic_roles.go` | Add audit logs on role CRUD (PostRoles, when implemented) |
| `internal/usecases/logic_profile.go` | Add audit log on profile update (PutProfile) |
| `internal/usecases/logic_auth_recovery.go` | Add audit logs on password reset/restore |
| `internal/adapters/out/postgres/repository.go` | Implement AuditLogRepo with DB connection + Save + FindAll with filtering |
| `internal/adapters/in/http/handlers_generated.go` | `handleGetAuditLogs` needs query param parsing |
| `cmd/server/main_generated.go` | Wire AuditLogRepo into Logic |
| `init_generated.sql` | Change oldvalue/newvalue from TEXT to JSONB (migration) |

### Frontend
| File | Why Affected |
|------|-------------|
| `types/dti.ts` | `AuditLogFilter` — add `user_id`? `changed_by`? |
| `sdk/hooks/useAuditLogs.ts` | Add pagination support |
| `components/organisms/AuditLogsTable.tsx` | Full rewrite: filters, pagination, diff display, metadata |
| `components/organisms/config/AccesosConfig.tsx` | Pass filters to useAuditLogs |

## Approaches

### Approach 1: Application-Level Only
**Implement AuditLogRepo fully and add audit calls in every use case. Disable/ignore the trigger.**

- **Pros**: Full control over what gets logged, IP/user context from HTTP layer, custom action names (e.g., "login", "password_reset"), unified query interface, can compute and store diffs explicitly
- **Cons**: Must manually add audit calls to every use case (forgotten = not logged), no automatic DB-level capture, more code
- **Effort**: High (8 use case files + repo + wiring + migration + frontend)

### Approach 2: Trigger-Only (extend to all tables)
**Add triggers to ALL tables (user, role, etc.) and query `{table}_history` tables.**

- **Pros**: Automatic, zero use-case changes, cannot be forgotten
- **Cons**: Cannot log login events (not a DB mutation), no IP address, no custom action names (only INSERT/UPDATE/DELETE), no per-action permissions, harder to query across entity types, schema-per-table means complex queries
- **Effort**: Medium (add triggers + create a unified query view across all `*_history` tables)

### Approach 3: Hybrid (Recommended)
**Keep trigger for `user` table (already working) + implement application-level AuditLogRepo for everything else. Duplicate user CRUD logging in application-level for richer metadata.**

- **Pros**: Trigger gives automatic safety net for user data changes; application-level captures business events (login, password) with full context (IP, action type); best of both worlds
- **Cons**: Duplicate logging for user CRUD (slightly more storage, but negligible); two code paths to maintain
- **Effort**: High but most complete

### Approach 4: Unified Application-Level (simplified hybrid)
**Implement application-level AuditLogRepo. Keep the trigger for `user` table but don't extend it. Application-level captures everything including user CRUD.**

- **Pros**: Single audit query path (just `auditlog` table), trigger is a nice-to-have fallback, clean separation, full IP/context on all events
- **Cons**: User CRUD logged twice (trigger + application), but user_history is only used by the deprecated `handleGetUserHistory` handler
- **Effort**: High but cleaner than full hybrid

## Recommendation

**Approach 4: Unified Application-Level** with the trigger kept as supplementary.

Rationale:
1. **Login events** are the most commonly requested audit event — they can ONLY be captured at application level (no DB INSERT for a login)
2. **IP address** is only available at the HTTP handler level, not in DB triggers
3. **One query interface** is dramatically simpler than UNION queries across 10+ `*_history` tables
4. The `user_history` trigger can stay — it's already working and provides a redundancy layer. The `handleGetUserHistory` handler already works against it.
5. The `auditlog` table schema with EntityType + EntityID + Action is much more semantic for business users than raw `TG_OP` values

Key architectural decisions:

**A) AuditLogRepo should ONLY implement `Save` and a rich `FindAll(filter)`.**
- No need for FindByID, Update, Delete (audit logs are append-only)
- `FindAll` needs: entity_type, action, from_date, to_date, changed_by, limit, offset, order_by

**B) GetAuditLogsRequest needs filter fields.**
- Currently empty struct — needs: EntityType, Action, From, To, ChangedBy, Limit, Offset

**C) Audit logging in use cases should be a helper method.**
- Something like `l.logAudit(ctx, entityType, entityID, action, oldVal, newVal, changedBy, ipAddr)`
- Or better: extract IP/changedBy at the handler level and pass in the request context

**D) Schema migration needed.**
- `auditlog.oldvalue` and `auditlog.newvalue` need to change from `TEXT` to `JSONB`
- Either an ALTER TABLE migration or a new migration file
- Index on `(entitytype, action, changedat)` for query performance

**E) Frontend** needs substantial work:
- Structured filters (dropdown for Action, EntityType; date range picker; user search)
- Pagination (backend already supports limit/offset)
- Diff display for updates: show OldValue vs NewValue side-by-side or inline
- Row expansion for full metadata
- Replace `Record<string, unknown>` with proper `AuditLog` type

## Risks and Edge Cases

1. **PII in audit logs**: OldValue/NewValue contain full user data (email, name, password hashes!). Password hashes should be excluded or redacted before logging.
2. **Storage growth**: Audit logs are append-only and grow unbounded. Need a retention policy (e.g., auto-delete after 1 year) or a scheduled cleanup job.
3. **Circular audit logging**: If the audit log Save fails, should the original operation fail too? Recommendation: fire-and-forget (log error, don't fail the main operation).
4. **Performance on FindAll**: Without proper indexes, querying millions of audit log rows will be slow. Need indexes on (entitytype, action, changedat) and (changedby).
5. **Request context threading**: The use case layer doesn't have access to HTTP request context (IP, current user ID). These need to be extracted at the handler layer and passed through. Options:
   - Add IP/changedBy to the request structs
   - Store in context: `ctx = context.WithValue(ctx, "user_id", uid)` and extract in use case
   - Use the existing `current_setting('audit.user_id', true)` approach from the middleware
6. **Password field in UpdateUser**: The current `handleUpdateUser` receives the full `User` body from the frontend, which may NOT include PasswordHash (it's skipped in Update if empty). The old value fetched from DB WILL have the hash — we must redact it before storing in OldValue.
7. **Concurrent migrations**: There are 5+ conflicting `create_AuditLog.up.sql` migration files from different generations — need to clean these up.
8. **BFF vs direct service calls**: The frontend goes through BFF. The BFF adds Authorization header from cookie. The users-service auth middleware then sets `user_id` in echo context. The IP is available via `c.RealIP()`.

## Estimated Scope by Layer

| Layer | Files to Change | Estimated Effort |
|-------|----------------|------------------|
| Backend — Repository | 2 files (repo + ports) | Medium |
| Backend — Use Cases | 6 files (logic + 5 use case files) | High |
| Backend — Handlers | 1 file (handler query parsing) | Low |
| Backend — Wiring | 2 files (logic.go + main.go) | Low |
| Backend — Schema | 1 migration + init_generated.sql | Low |
| Frontend — Types | 1 file (AuditLogFilter) | Low |
| Frontend — API/Hooks | 2 files (users-api, useAuditLogs) | Low |
| Frontend — Table | 1 file (AuditLogsTable) | High |
| Frontend — Config | 1 file (AccesosConfig) | Low |
| **Total** | **~17 files** | **~2-3 days** |

## Ready for Proposal
**Yes**. The exploration is thorough enough. Key decisions for the proposal:
1. Confirm approach (Application-Level Unified recommended)
2. Decide retention policy
3. Decide on password hash redaction strategy
4. Decide how to pass request context (IP + user ID) to use cases
