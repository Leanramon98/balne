# Proposal: Full Audit Log Tracking System

## Intent

The "Historial de Acceso" (Access History) screen in the Config section needs to track **every action users perform** — logins, creates, edits, deletes — with date/time, who did it, what changed (before/after), and the user's IP address. Currently, the system has two scaffolded-but-unfinished audit mechanisms: a working DB trigger for the `user` table only (`user_history`), and a completely unimplemented `auditlog` table + `AuditLogRepo` (all methods `panic("not implemented")`). The frontend table shows data that doesn't exist yet, with no structured filters, no pagination, and no diff view.

This proposal covers the **application-level audit logging** that captures login events, user CRUD, profile changes, and password operations with full context (IP, timestamps, diffs), plus a filterable frontend.

## Scope

### In Scope
- **AuditLogRepo implementation**: Save + rich FindAll with filtering, sorting, pagination (remove stubs)
- **Login audit logging**: `user.login` action on successful authentication
- **User CRUD audit logging**: `user.create`, `user.update`, `user.delete` actions with OldValue/NewValue diffs
- **Profile update audit logging**: `profile.update` action
- **Password operations**: `user.password_change`, `user.password_reset`, `user.password_restore` actions
- **Schema migration**: `auditlog.oldvalue` and `auditlog.newvalue` from TEXT to JSONB
- **Database indexes**: Composite index on `(entitytype, action, changedat)` + index on `changedby`
- **IP address capture**: Extract from HTTP request (`c.RealIP()`) and store in audit entries
- **Frontend AuditLogsTable rewrite**: Structured filters, pagination, diff view (OldValue vs NewValue), proper typed props
- **AccesosConfig**: Wire filters to `useAuditLogs`
- **Dashboard recent activity**: Ensure compatibility with existing `useAuditLogs({ limit: 10 })` usage

### Out of Scope
- **Role CRUD audit logging**: Role management logic is not fully implemented yet; audit stubs left for future
- **Evaluations-service audit logging**: Separate service, separate change thread
- **CSV/PDF export of audit logs**: Disabled "Exportar" button stays disabled for now
- **Real-time audit log streaming (WebSocket)**: Not requested, not needed
- **Automatic cleanup/retention policy enforcement**: Policy is **defined** here but enforcement is a follow-up task
- **Trigger-based audit for other tables**: `user_history` trigger stays for `user` table only, not extended
- **Audit log deletion/update**: Append-only by design — no Update, no Delete in repository

## Target Users

| User | Needs |
|------|-------|
| **Administrador** (admin) | Full access to all audit logs. Needs to investigate user activity, see what data was changed, and trace unauthorized modifications. |
| **Evaluador** (evaluator) | Can see only their own actions or actions related to their destinations. (Future: filtered by evaluation access.) |
| **Observador** (observer) | Read-only view of audit logs relevant to their scope. |

Primary user is **Administrador** — the "Historial de Acceso" screen lives under Config, which is admin-only.

## Tracking Scope

| Action | Entity | Trigger Point | OldValue | NewValue | Notes |
|--------|--------|---------------|----------|----------|-------|
| `user.login` | User | Post successful auth in `PostAuthLogin` | N/A | N/A | Only log success; failed attempts are separate |
| `user.create` | User | After `PostUsers` creates user | N/A | New user data | Redact password hash |
| `user.update` | User | After `UpdateUser` persists changes | Full pre-update user | Full post-update user | Redact password hash in both |
| `user.delete` | User | After `DeleteUser` deletes | Full deleted user | N/A | Store what was deleted |
| `user.password_change` | User | After password change within session | N/A | N/A | Never store the password value |
| `user.password_reset` | User | After password reset via recovery | N/A | N/A | Never store the password value |
| `user.password_restore` | User | After admin restores user password | N/A | N/A | Never store the password value |
| `profile.update` | Profile | After `PutProfile` saves changes | Full pre-update profile | Full post-update profile | |

### What Is NOT Stored in Audit Logs

- **Password hashes** (bcrypt output) — redacted from OldValue/NewValue
- **JWT tokens or session IDs** — not logged
- **Failed login attempts** — not in scope (would be a separate rate-limiting/security concern)
- **Read/view operations** — only mutations and logins. "Viewed X" is not tracked (would be overwhelming noise)

## Data Model

### Table: `auditlog` (modified from current)

```sql
CREATE TABLE auditlog (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type   VARCHAR(100) NOT NULL,   -- 'user', 'profile', 'auth'
    entity_id     VARCHAR(255),             -- UUID of the affected entity
    action        VARCHAR(100) NOT NULL,    -- 'user.create', 'user.update', 'user.login', etc.
    old_value     JSONB,                    -- Previous state (NULL for creates/logins)
    new_value     JSONB,                    -- New state (NULL for deletes)
    changed_by    VARCHAR(255) NOT NULL,    -- User ID or email
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address    VARCHAR(45)               -- IPv4 or IPv6
);

-- Indexes
CREATE INDEX idx_auditlog_entity ON auditlog (entity_type, action, changed_at DESC);
CREATE INDEX idx_auditlog_changed_by ON auditlog (changed_by);
CREATE INDEX idx_auditlog_changed_at ON auditlog (changed_at DESC);
```

### Migration

- Current `oldvalue`/`newvalue` are `TEXT` — must migrate to `JSONB`
- Existing rows (likely zero in dev, possibly zero in prod too since repo was never implemented): `ALTER TABLE auditlog ALTER COLUMN old_value TYPE JSONB USING old_value::JSONB`
- If there are actual TEXT rows that aren't valid JSON, set them to `'{}'::jsonb`
- Clean up the 5+ conflicting migration files from prior generations (consolidate into one)

### Go Domain Entity (already defined, no changes needed)

```go
type AuditLog struct {
    ID          string          `json:"id"`
    EntityType  string          `json:"entity_type"`
    EntityID    string          `json:"entity_id"`
    Action      string          `json:"action"`
    OldValue    json.RawMessage `json:"old_value"`
    NewValue    json.RawMessage `json:"new_value"`
    ChangedBy   string          `json:"changed_by"`
    ChangedAt   time.Time       `json:"changed_at"`
    IPAddress   string          `json:"ip_address"`
}
```

## Approach

**Approach: Unified Application-Level (Approach 4 from exploration)**

### Why Not Triggers
1. **Login events** can ONLY be captured at application level (no DB row mutation for a login)
2. **IP address** is only available in the HTTP handler, not in DB triggers
3. **Semantic actions** (`user.login`, `user.password_reset`) are much more useful for business users than raw `TG_OP` values (`INSERT`, `UPDATE`, `DELETE`)
4. **Single query interface** — one `auditlog` table instead of UNION across 10+ `*_history` tables

### Why Not Full Hybrid (Approach 3)
- The existing `user_history` trigger is already working and provides a safety net. Keeping it is free redundancy.
- Application-level audit duplicating `user` CRUD is acceptable — storage is negligible, and frontend queries only the `auditlog` table.

### Architecture

```
HTTP Handler (c.RealIP(), auth user ID)
    │
    ▼
Use Case (business logic) ──► l.logAudit(ctx, entityType, entityID, action, oldVal, newVal)
    │                                │
    │                                ▼
    │                        AuditLogRepo.Save()
    │                        (fire-and-forget — log error, don't fail main op)
    │
    ▼
Postgres DB (auditlog table)
```

### Key Design Decisions

1. **Save-only repository**: `AuditLogRepo` implements only `Save(auditLog)` and `FindAll(filter)`. No `Update`, `Delete`, or `FindByID` — audit logs are append-only.

2. **Helper method on Logic struct**:
   ```go
   func (l *Logic) logAudit(ctx context.Context, entityType, entityID, action string, oldVal, newVal interface{}) {
       // Extract user ID and IP from context
       userID, _ := ctx.Value("user_id").(string)
       ip, _ := ctx.Value("ip_address").(string)

       // Redact sensitive fields
       sanitizedOld := redactSensitive(oldVal)
       sanitizedNew := redactSensitive(newVal)

       entry := &AuditLog{
           EntityType: entityType,
           EntityID:   entityID,
           Action:     action,
           OldValue:   toJSON(sanitizedOld),
           NewValue:   toJSON(sanitizedNew),
           ChangedBy:  userID,
           IPAddress:  ip,
       }

       if err := l.auditLogRepo.Save(ctx, entry); err != nil {
           l.logger.Error("failed to save audit log", "error", err)
       }
   }
   ```

3. **Request context threading**: Extract `user_id` and `ip_address` in the HTTP handler layer and store them in `context.Context`:
   ```go
   ctx = context.WithValue(ctx, "user_id", userID)
   ctx = context.WithValue(ctx, "ip_address", c.RealIP())
   ```

4. **Fire-and-forget audit**: Audit log failures never block the main operation. Log the error, continue.

5. **Redact sensitive fields**: Before storing OldValue/NewValue, strip `password_hash`, `password`, `token`, `secret` fields from the JSON.

## PII / Security Concerns

### What Gets Redacted
- `password_hash`, `password`, `token_hash`, `recovery_token`, `secret` — always stripped from both OldValue and NewValue before storing
- These are well-known field names; we can use a JSON walker or field-name matcher

### Implementation
```go
func redactSensitive(v interface{}) interface{} {
    if v == nil { return nil }

    sensitiveKeys := map[string]bool{
        "password_hash": true,
        "password":      true,
        "token_hash":    true,
        "recovery_token": true,
    }

    m, ok := v.(map[string]interface{})
    if !ok { return v }

    for k := range m {
        if sensitiveKeys[strings.ToLower(k)] {
            m[k] = "[REDACTED]"
        }
    }
    return m
}
```

## Storage & Retention

### Retention Policy
- **Default retention**: 90 days for regular audit logs
- **Why 90 days**: Balances compliance requirements with storage cost. Most audit investigations look at recent activity (last few days/weeks). 90 days covers typical incident response windows.
- **Configurable**: Retention period should be an environment variable `AUDIT_LOG_RETENTION_DAYS` (default: 90)

### Cleanup Strategy
- **Operational cleanup**: A scheduled job (cron or simple goroutine) that runs daily and deletes records older than the retention period:
  ```sql
  DELETE FROM auditlog WHERE changed_at < NOW() - INTERVAL '90 days';
  ```
- **Implementation timing**: The cleanup job is a **follow-up task** — the critical path is capture + display. Define the policy now, implement the cleanup after the core flow is working.
- **Storage estimate**: ~500 bytes per audit entry × ~500 actions/day × 90 days ≈ ~22.5 MB. Negligible.

### Why Not Archive to Separate Table
- For the current scale (single-tenant DTI, hundreds of users), the `auditlog` table can handle millions of rows with proper indexing. Archiving is premature optimization.

## Frontend Filtering Requirements

### Filters (from the user's request: "filterable right there by all these fields")

| Filter | Type | Behavior |
|--------|------|----------|
| **Entity type** | Dropdown | Multi-select: User, Profile, Auth. Default: all. |
| **Action** | Dropdown | Multi-select: create, update, delete, login, password_change, etc. Default: all. |
| **Date range** | Date range picker | From/To with calendar. Default: last 7 days. |
| **Changed by** | Text input | Autocomplete or free-text search by user name/email. |
| **IP address** | Text input | Exact match or prefix search on IP. |

### Frontend Implementation

1. **AuditLogFilter type** — extend with `changed_by` and `ip_address` fields:
   ```typescript
   export interface AuditLogFilter {
     entity_type?: string;
     action?: string;
     from?: string;       // ISO date string
     to?: string;         // ISO date string
     changed_by?: string;
     ip_address?: string;
     limit?: number;
     offset?: number;
     order_by?: string;   // 'changed_at DESC' (default)
   }
   ```

2. **AuditLogsTable** — full rewrite:
   - Accept `AuditLog[]` instead of `Record<string, unknown>[]`
   - Filter bar above the table (collapsible)
   - Pagination controls (Previous/Next + page info)
   - Expandable rows showing OldValue vs NewValue diff (side-by-side JSON or key-value pairs)
   - Badge/Action type display (color-coded: green for create, blue for update, red for delete, purple for login)
   - Export button: still disabled, marked "Próximamente"

3. **Pagination strategy**: Server-side pagination via `limit` + `offset`. Frontend requests page 1 (e.g., 25 rows), shows page count based on total count (need to add `total` to response).

4. **Backend response format**:
   ```json
   {
     "data": [ ... audit logs ... ],
     "total": 1523,
     "limit": 25,
     "offset": 0
   }
   ```

### Diff View for Updates

When a user clicks or expands a row with action `user.update`, show:

```
Old Value                    New Value
─────────                    ─────────
name: "Juan Pérez"           name: "Juan Pérez"          ← unchanged
email: "juan@old.com"        email: "juan@new.com"       ← changed
role: "evaluador"            role: "administrador"       ← changed
```

Changed fields highlighted (amber background), unchanged fields dimmed.

## Implementation Approach (Per Layer)

### Layer 1: Schema & Migration

| Step | File | What |
|------|------|------|
| 1.1 | `init_generated.sql` | Change `oldvalue`/`newvalue` from TEXT to JSONB in `auditlog` table definition |
| 1.2 | New migration file | `ALTER TABLE` for existing DBs, add indexes |
| 1.3 | Cleanup | Consolidate/remove conflicting audit migration files from prior generations |

### Layer 2: Backend Repository

| Step | File | What |
|------|------|------|
| 2.1 | `internal/ports/out/ports_generated.go` | Update `AuditLogRepository.FindAll` signature to accept filter struct |
| 2.2 | `internal/adapters/out/postgres/repository.go` | Implement `AuditLogRepo` — add `db` field, implement `Save()` and `FindAll()` with SQL queries and parameterized filters |

### Layer 3: Backend Use Cases

| Step | File | What |
|------|------|------|
| 3.1 | `internal/usecases/logic.go` | Add `auditLog AuditLogRepository` field + `WithAuditLogRepository` option |
| 3.2 | `internal/usecases/logic_audit.go` | Implement `GetAuditLogs` with filter/pagination/sort — replace `panic("not implemented")` |
| 3.3 | `internal/usecases/logic_auth.go` | Add `l.logAudit()` call on successful login |
| 3.4 | `internal/usecases/logic_users.go` | Add `l.logAudit()` calls in `PostUsers`, `UpdateUser`, `DeleteUser` |
| 3.5 | `internal/usecases/logic_profile.go` | Add `l.logAudit()` call in `PutProfile` |
| 3.6 | `internal/usecases/logic_auth_recovery.go` | Add `l.logAudit()` calls on password reset/restore |

### Layer 4: Backend Handlers & Wiring

| Step | File | What |
|------|------|------|
| 4.1 | `internal/ports/in/ports_generated.go` | Add filter fields to `GetAuditLogsRequest` |
| 4.2 | `internal/adapters/in/http/handlers_generated.go` | Parse query params for `handleGetAuditLogs`, inject user_id/IP into context |
| 4.3 | `cmd/server/main_generated.go` | Create `AuditLogRepo` with DB connection, wire into `Logic` via `WithAuditLogRepository` |

### Layer 5: Frontend

| Step | File | What |
|------|------|------|
| 5.1 | `types/dti.ts` | Extend `AuditLogFilter` — add `changed_by`, `ip_address`, `order_by` |
| 5.2 | `sdk/hooks/useAuditLogs.ts` | Add pagination support — accept `{ total, logs }` response shape, return page info |
| 5.3 | `sdk/api/users-api.ts` | Update `getAuditLogs` to use proper types + parse paginated response |
| 5.4 | `components/organisms/AuditLogsTable.tsx` | Full rewrite: typed props, filter bar, pagination, expandable diff rows, action badges |
| 5.5 | `components/organisms/config/AccesosConfig.tsx` | Wire filter state → `useAuditLogs` |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `services/users-service/init_generated.sql` | Modified | `auditlog` table columns TEXT → JSONB |
| `services/users-service/internal/domain/entities.go` | Unchanged | `AuditLog` entity is already correct |
| `services/users-service/internal/ports/out/ports_generated.go` | Modified | `AuditLogRepository.FindAll` signature |
| `services/users-service/internal/ports/in/ports_generated.go` | Modified | `GetAuditLogsRequest` filter fields |
| `services/users-service/internal/usecases/logic.go` | Modified | Add `auditLog` field + option |
| `services/users-service/internal/usecases/logic_audit.go` | Modified | Full `GetAuditLogs` impl |
| `services/users-service/internal/usecases/logic_auth.go` | Modified | Login audit |
| `services/users-service/internal/usecases/logic_users.go` | Modified | User CRUD audit |
| `services/users-service/internal/usecases/logic_profile.go` | Modified | Profile update audit |
| `services/users-service/internal/usecases/logic_auth_recovery.go` | Modified | Password ops audit |
| `services/users-service/internal/adapters/out/postgres/repository.go` | Modified | `AuditLogRepo` impl |
| `services/users-service/internal/adapters/in/http/handlers_generated.go` | Modified | Query param parsing + context injection |
| `services/users-service/cmd/server/main_generated.go` | Modified | Wiring |
| `frontend/types/dti.ts` | Modified | `AuditLogFilter` additions |
| `frontend/sdk/hooks/useAuditLogs.ts` | Modified | Pagination support |
| `frontend/sdk/api/users-api.ts` | Modified | Typed response + pagination |
| `frontend/components/organisms/AuditLogsTable.tsx` | Modified | Full rewrite |
| `frontend/components/organisms/config/AccesosConfig.tsx` | Modified | Wire filters |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Audit Save failure blocks main operation | Low | High | **Fire-and-forget**: log error, never fail the main op |
| PII leakage via OldValue/NewValue (password hashes) | Medium | Critical | **Redact before store**: strip `password_hash`, `password`, `token` fields |
| Unbounded storage growth | Medium | Medium | **Retention policy**: 90-day default, configurable, cleanup job as follow-up |
| Migrating TEXT→JSONB on existing rows fails | Low | Medium | **Safe migration**: cast with `USING old_value::JSONB`, fallback to `'{}'` |
| Query performance degrades with millions of rows | Low (short-term) | Medium | **Indexes**: composite index on (entity_type, action, changed_at) |
| IP address not available (internal service calls) | Medium | Low | **Default**: store empty string or "internal" when IP is unavailable |
| Conflicting migration files from prior generations | Medium | Low | **Cleanup**: consolidate into a single migration |

## Rollback Plan

### Per-Layer Rollback

1. **Schema**: Run `ALTER TABLE auditlog ALTER COLUMN old_value TYPE TEXT` (reverse migration). Drop added indexes.
2. **Backend repository**: Revert `repository.go` — put back `panic("not implemented")` stubs for `AuditLogRepo` methods (or comment out the real impl).
3. **Backend use cases**: Comment out all `l.logAudit()` calls in `logic_auth.go`, `logic_users.go`, `logic_profile.go`, `logic_auth_recovery.go`.
4. **Backend wiring**: Revert `logic.go` (remove `auditLog` field) and `main_generated.go` (remove wiring).
5. **Frontend**: Revert `AuditLogsTable.tsx` to current version, `AccesosConfig.tsx` to current wrapper, `useAuditLogs.ts` to original SWR key, `users-api.ts` to original API call.

### Rollback Independence

Layers are independent — you can roll back frontend without backend and vice versa:
- Frontend-only rollback: frontend reverts to untyped `Record<string, unknown>` table, still shows (empty) data from backend
- Backend-only rollback: backend stops logging new entries, existing `auditlog` rows are unaffected
- Schema rollback is only needed if the migration causes issues; TEXT→JSONB is backward-compatible (app reads JSONB fine, it's a superset)

## Dependencies

- **None external**: All dependencies are already in the project (PostgreSQL, Echo, Go stdlib `encoding/json`)
- **No new npm packages**: Frontend uses existing shadcn/ui components (Table, Input, Select, DatePicker, Badge, Pagination)

## Success Criteria

- [ ] Successful login creates an audit log entry with action `user.login`, user ID, timestamp, and IP address
- [ ] Creating a user creates an audit log entry with the new user data (password hash redacted)
- [ ] Updating a user creates an audit log entry with both old and new values (password hash redacted in both)
- [ ] Deleting a user creates an audit log entry with the deleted user data
- [ ] Password change/reset/restore create audit log entries
- [ ] Profile update creates an audit log entry with old and new values
- [ ] `GET /audit-logs` returns filtered, paginated, sorted results
- [ ] Frontend AuditLogsTable shows structured filters (entity type, action, date range, user)
- [ ] Frontend shows pagination controls (Previous/Next)
- [ ] Expanding a "user.update" row shows a diff (OldValue vs NewValue) with changed fields highlighted
- [ ] Dashboard recent activity section still works (uses same hook with `{ limit: 10 }`)
- [ ] Audit Save failure does NOT block the original operation (fire-and-forget)
- [ ] All existing users-service tests pass
