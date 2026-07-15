# Design: Full Audit Log Tracking System

## Technical Approach

Application-level audit using a `logAudit` helper on the `Logic` struct, called at each mutation point (login, user CRUD, profile update, password ops). Audit entries stored in `auditlog` table after JSONB migration. Repository exposes only `Save` and a rich `FindAll` with filters, pagination, and sorting. Frontend uses SWR with server-side filtering — filter changes trigger revalidation. PII redaction at save time; audit failures are fire-and-forget.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audit save strategy | Fire-and-forget goroutine | Audit must never block the triggering operation. Log error, continue. |
| OldValue/NewValue types | `json.RawMessage` → JSONB column | Domain entity already uses `json.RawMessage`. TEXT → JSONB migration enables JSON operators in queries. |
| IP extraction | Echo `c.RealIP()` → `context.WithValue(ctx, "ip_address", ip)` | IP only available in HTTP layer. Injected via context before use case call. |
| GetAuditLogs filter params | Add fields to `GetAuditLogsRequest` (despite `_generated` suffix) | Spec requires these params; the request struct is the contract. Maintainers already edit generated handler/port files in this project. |
| Backend response shape | `{ Items: []*AuditLog, Total: int, Limit: int, Offset: int }` | Matches existing paginated responses (`GetUsersResponse`). Adds `Limit`/`Offset` for client awareness. |
| Frontend filter state | `useState` in `AccesosTab`, passed to `useAuditLogs(filters)` | SWR revalidates on filter change. Server-side filtering — no client-side filter logic in table component. |
| Diff view | Expandable row, inline diff of changed JSONB fields | Action badges identify row type. "update" rows render OldValue vs NewValue with highlighted changes. |

## Data Flow

```
AccesosTab (filters: useState) 
  → useAuditLogs(filters) 
    → SWR GET /api/audit-logs?{params} 
      → BFF proxy → api-gateway → users-service handleGetAuditLogs 
        → GetAuditLogs(filters) 
          → AuditLogRepo.FindAll(ctx, filters) 
            → PostgreSQL (dynamic WHERE, ORDER BY, LIMIT/OFFSET on JSONB columns)
```

Audit capture flow:
```
handlePostAuthLogin (echo.Context) 
  → inject ip_address + user_id into context.WithValue 
    → PostAuthLogin(ctx) 
      → on success: go l.logAudit(ctx, "auth", user.ID, "user.login", nil, nil)
```

## File Changes

### Backend — Modified

| File | Changes |
|------|---------|
| `init_generated.sql` | `auditlog.oldvalue`/`newvalue` TEXT → JSONB; add indexes (entity_type+action+changed_at, changed_by, changed_at) |
| `migrations/` | Consolidate 10+ duplicate `create_AuditLog` migrations into single migration; new migration for ALTER COLUMN TYPE + indexes |
| `ports/in/ports_generated.go` | Add fields to `GetAuditLogsRequest`: EntityType, Action, ChangedBy, From, To, Search, SortBy, SortOrder, Limit, Offset. Add Limit/Offset to `GetAuditLogsResponse`. |
| `ports/out/ports_generated.go` | Replace `FindAll(ctx)` signature with `FindAll(ctx, filters AuditLogFilters)` — new filter struct. |
| `adapters/out/postgres/repository.go` | `AuditLogRepo`: add `db *DB` field. Implement `Save` (INSERT), `FindAll` (dynamic WHERE + pagination + sorting). `Update`/`Delete`/`FindByID` remain unimplemented per append-only design. |
| `usecases/logic.go` | Add `auditLogRepo AuditLogRepository` field + `WithAuditLogRepository` option. |
| `usecases/logic_audit.go` | Replace panic with full `GetAuditLogs` impl. Add `logAudit` helper (PII redaction, JSON serialization, fire-and-forget save). Define `AuditLogFilters` struct. |
| `usecases/logic_auth.go` | After successful login: `l.logAudit(ctx, "auth", user.ID, "user.login", nil, nil)` |
| `usecases/logic_users.go` | After `PostUsers`: audit `user.create`. Before/after `UpdateUser`: fetch old user, audit `user.update` with diff. After `DeleteUser`: fetch user first, audit `user.delete` with old value. |
| `usecases/logic_profile.go` | Before/after `PutProfile`: fetch old user, audit `profile.update` with diff. |
| `usecases/logic_auth_recovery.go` | After `ResetPassword`: audit `user.password_reset`. After `RestorePasswordForUser`: audit `user.password_restore`. |
| `adapters/in/http/handlers_generated.go` | `handleGetAuditLogs`: parse all query params (entity_type, action, changed_by, from, to, search, sort_by, sort_order, limit, offset). Inject `ctx = context.WithValue(ctx, "ip_address", c.RealIP())` for mutation handlers. |
| `cmd/server/main_generated.go` | Create `auditRepo := postgres.NewAuditLogRepo(db)`. Wire: `usecases.WithAuditLogRepository(auditRepo)`. |

### Frontend — Modified

| File | Changes |
|------|---------|
| `types/dti.ts` | Add `changed_by`, `search`, `sort_by`, `sort_order` to `AuditLogFilter`. Add `AuditLogResponse` type (`items`, `total`, `limit`, `offset`). |
| `sdk/api/users-api.ts` | `getAuditLogs`: add `search`, `changed_by`, `sort_by`, `sort_order` to query params. Change return type to `AuditLogResponse`. |
| `sdk/hooks/useAuditLogs.ts` | Return typed `AuditLogResponse` instead of `AuditLog[]`. Destructure `items`, `total`. |
| `components/organisms/AuditLogsTable.tsx` | Full rewrite: typed `AuditLog` props, 5 columns (Fecha | Usuario | Acción | Entidad | IP), action badges, expandable diff for "update" rows, pagination component. Remove `Record<string, unknown>` usage. |
| `components/organisms/config/AccesosConfig.tsx` | Add `useState` for filter state (entity_type, action, changed_by, from, to, search). Render `AuditLogsTable` with typed data from `useAuditLogs(filters)`. Pass `total`, `limit`, `offset` for pagination. |

## Interfaces / Contracts

```go
// New: filter struct for repo queries (logic_audit.go)
type AuditLogFilters struct {
    EntityType string
    Action     string
    ChangedBy  string
    From       string
    To         string
    Search     string
    SortBy     string
    SortOrder  string
    Limit      int
    Offset     int
}
```

```typescript
// Modified: AuditLogFilter (types/dti.ts)
export interface AuditLogFilter {
  entity_type?: string;
  action?: string;
  changed_by?: string;
  from?: string;
  to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Go) | `logAudit` helper: PII redaction, fire-and-forget error handling | Table-driven tests with mock `AuditLogRepository` |
| Unit (Go) | `AuditLogRepo.FindAll`: dynamic WHERE, pagination, sorting | Integration test with test PostgreSQL |
| Unit (TS) | `AuditLogsTable`: renders rows, filter state, diff view | Jest + RTL with mock data |
| E2E | Login → audit entry created; GET /audit-logs returns filtered results | Playwright: login, verify audit-log endpoint |

## Open Questions

None — all technical decisions resolved in proposal/spec.
