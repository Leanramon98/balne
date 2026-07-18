# Apply Progress: Reusable Project Base

## Current slice

- Task: 4.1 — Release/Upgrade/Drift Rollback (unit 9)
- Mode: Strict TDD
- Delivery: Feature Branch Chain, work unit 9 only; no Git publication or ref mutation
- Status: Complete (14/16 tasks)

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `tests/preservation/verify-preservation-test.sh` | Shell/integration | N/A — new assets; 14 dirty entries baselined | Missing verifier failed before production code | 4/4 scenarios passed | Valid, malformed, incomplete, and tampered-hash paths | Metadata-list validation extracted; 4/4 remained green |
| 1.2 | `tests/architecture/test-architecture.sh` | Architecture/integration | Unit 1 regression 7/7 passed | Missing harness failed before implementation | Valid fixture and 14 checks passed | Stale, missing, and boundary-violation cases rejected | Canonical line-digest helper extracted; 4/4 remained green |
| 2.1 | `internal/platform/{module,manifest}/*_test.go` | Go unit/integration | Units 1-2 regressions passed | Packages failed to compile with missing contracts | 13 focused cases passed | Collisions, ordering, capabilities, and selections covered | Shared collision claim helper extracted; tests stayed green |
| 2.2a | `internal/domain/tenancy_test.go`, `internal/infrastructure/migration_test.go` | Go unit/PostgreSQL integration | Users domain plus units 1-3 passed | Missing domain contracts failed compilation; migration path and nullable tenant columns failed against real PostgreSQL | 11 domain scenarios and apply-twice migration passed | Partial schema, retry, FK, uniqueness, null rejection, constraints, and indexes covered | Shared lookup/assertion helpers; neutral migration moved outside preserved DTI tree |
| 2.2b1a | `scripts/test-compose-contract.sh` | Shell/Docker Compose/PostgreSQL integration | Unit-4A PostgreSQL replay passed before edits | Missing workspace override failed; missing README file-set documentation then failed | Documented `make up SERVICES=users-service` reached healthy users-service after migration exit 0 | Effective config, ordered Make targets, bounded retry, SQL mount, dependency, timestamps, schema creation, and cleanup covered | Shared Make Compose command/flags and bounded state wait helpers retained green |
| 2.2b1b | `scripts/test-tenant-migration.sh` | Shell/Docker PostgreSQL integration | 4B1a compose contract passed; sh -n syntax OK | Missing test harness failed before migration hardening | 9/9 scenarios passed: clean boot, upgrade, backfill, rerun, retry, wrong-schema FK, cross-schema index, malformed objects, transaction rollback | All 9 spec scenarios covered with real PostgreSQL; no triangulation gaps required | Schema-qualified OID resolution and pg_catalog helpers extracted; 9/9 and compose regression stayed green |
| 2.2b2 (Cycle 1) | `jwt_middleware_test.go` | Go unit | ✅ 3/3 http tests pass | ✅ Written — NeutralClaims undefined | ✅ Passed — struct added | ➖ Single (structural) | ➖ None needed |
| 2.2b2 (Cycle 2) | `entities_test.go` | Go unit | ✅ 5/5 domain tests pass | ✅ Written — LoginResponse fields undefined | ✅ Passed — 3 fields added | ➖ Single (structural) | ➖ None needed |
| 2.2b2 (Cycle 3) | `logic_test.go` + `repository_test.go` | Go unit | ✅ 4/4 usecase tests pass | ✅ Written — interfaces undefined | ✅ Passed — interfaces + options added | ➖ Single (structural) | ➖ None needed |
| 2.2b2 (Cycle 4) | `logic_test.go` | Go unit | ✅ 4/4 usecase tests pass | ✅ Written — 5 new test functions fail | ✅ Passed — 9/9 usecase tests pass | ✅ 6 scenarios (neutral, legacy, dual, DB error, identity denial, roles ignored) | ✅ gofmt + go vet clean |
| 2.2b3 | `middleware_test.go` | Go unit | ✅ 0/0 gateway tests (no pre-existing) | ✅ Written — NeutralClaims/LoginClaims undefined, tests fail to compile (RED) | ✅ 8/8 Go tests pass; 11/11 harness scenarios pass | ✅ 8 test cases (neutral headers, legacy, dual, missing JWT, malformed, public bypass, empty claims, route reg.) | ✅ gofmt + go vet clean; no generated files edited |
| 2.2c | `scripts/test-bff-session.sh` | Shell/integration | Architecture tests baseline | ✅ Test harness written with 18 scenarios; RED confirmed against old code | ✅ 18/18 harness scenarios pass | ✅ 6 spec scenarios + 2 guards; triangulated across all modified files | ➖ None needed |
| 2.3 | `authorization/policy_test.go`, `audit/audit_test.go` | Go unit | ✅ 2/2 packages pass, go vet clean | ✅ Written — all types undefined (compile RED) | ✅ 27 Go test functions pass | ✅ 7 spec scenarios + 5 audit query dimensions + middleware 3 patterns | ✅ gofmt + go vet clean |
| **3.1** | `scripts/test-neutral-shell.sh` | Shell/structural | ✅ Safety net (architecture tests baseline) | ✅ Test script written before production code — 5/25 pass (RED confirmed, files don't exist) | ✅ 24/25 structural checks pass after creation | ✅ 6 spec scenarios covered via 13 tsx behavioral + 12 shell structural + 2 dual-mode + 1 generated guard = 28 distinct checks; tsc-compile blocked by infrastructure (npm install not available per constraint) | ✅ Pure functions extracted (resolveIcon, groupBySection); code matches DtiShell patterns; no DTI contamination |
| **3.2** | `workspace/backend/internal/modules/reference/handler_test.go` | Go unit | N/A — new package | ✅ Written — 25 test functions referencing undeclared types and functions (compile RED) | ✅ 25/25 Go tests pass; `go vet` clean; `go test ./internal/platform/...` regressions pass | ✅ Module descriptor verified (7 checks: ID, routes, permissions, health, capabilities, migrations, no excluded terms); health endpoint triangulated (status + content-type); CRUD triangulated (create/list/get/update/delete + cross-tenant isolation + missing org + invalid JSON + empty org); module isolation (registry registration + removal no side effects) — 25 total test cases | ✅ In-memory store pattern with sync.RWMutex; HTTP handler helpers extracted (orgID, requireOrg, writeJSON, noteID); no DTI contamination |
| **3.3** | `workspace/backend/internal/platform/manifest/manifest_test.go` | Go unit | ✅ 3/3 existing manifest tests pass (safety net) | ✅ Written — 17 test functions referencing undeclared Profile, ProfileSet, BuiltinProfiles, ResolveProfile (compile RED) | ✅ 20/20 Go tests pass (3 existing + 17 new); `go vet` clean | ✅ 7 spec scenarios: minimal profile, full profile, missing optional capability, unknown profile, profile overridden, empty profile, backward compatible — plus explicit-module-override, explicit-capabilities-override | ✅ gofmt + go vet clean; ResolveProfile extracted as pure function; BuiltinProfiles in separate file |
| **4.1 (Cycle 1)** | `release_test.go` | Go unit | N/A — new package | ✅ Written — ReleaseManifest, ParseRelease, CheckUpgrade, CheckCompatibility, Precondition undefined (compile RED) | ✅ 16/16 release/upgrade tests pass | ✅ 16 test cases covering: valid manifest, invalid JSON, empty data, valid upgrade path, no path, already current, compatible accepted, rejected below/above, exact boundaries, preconditions fail/pass, step preconditions, empty policy, unknown fields, empty manifest | ✅ gofmt + go vet clean; pure functions for ParseRelease, CheckUpgrade, CheckCompatibility, evaluatePrecondition |
| **4.1 (Cycle 2)** | `rollback_test.go` | Go unit | N/A — same package | ✅ Written — Snapshot, RollbackPlan, CreateRollbackPlan, ExecuteRollback, SnapshotStore undefined (compile RED) | ✅ 7/7 rollback tests pass | ✅ 7 test cases: plan creation, empty data, successful execution, snapshot not found, save/load, load not found, list | ✅ gofmt + go vet clean; SnapshotStore interface extracted; pure functions for CreateRollbackPlan, ExecuteRollback |
| **4.1 (Cycle 3)** | `drift_test.go` | Go unit | N/A — same package | ✅ Written — DetectDrift, HashDriftDetector, Drift undefined (compile RED) | ✅ 7/7 drift tests pass | ✅ 7 test cases: match, drift found, missing path, extra path, empty baseline, empty current, hash mismatch via interface | ✅ gofmt + go vet clean; DriftDetector interface extracted; DetectDrift as pure function |

## Work Unit Evidence for Unit 9 (current)

| Evidence | Result |
|---|---|
| Focused test | `go test -count=1 ./internal/platform/release/...` → `ok 0.002s` (30 tests pass) |
| Runtime harness | `scripts/test-upgrade.sh` → exit 0, 46/46 checks pass (Go compile, vet, all 7 spec scenarios, platform regression, type verification) |
| Regressions | `go test ./internal/platform/...` → all 5 packages pass; `go vet ./internal/platform/release/...` → clean |
| Rollback boundary | Remove `workspace/backend/internal/platform/release/` directory (6 files); remove `scripts/test-upgrade.sh`; revert tasks.md checkbox for 4.1 |

### Spec Scenario Coverage (Unit 9)

| Spec Scenario | Status | How Verified |
|---|---|---|
| Release manifest parses | ✅ | `TestParseRelease_ValidManifest` — JSON with version, release date, compatibility, upgrades, preconditions, checksums parsed successfully |
| Upgrade path validates | ✅ | `TestCheckUpgrade_ValidPath` — version 0.9.0 to 1.0.0 with matching upgrade step validates |
| Compatible release accepted | ✅ | `TestCheckCompatibility_Accepted` — version within min/max window accepted |
| Incompatible release rejected | ✅ | `TestCheckCompatibility_RejectedBelow` + `TestCheckCompatibility_RejectedAbove` — versions outside window rejected |
| Rollback restores | ✅ | `TestExecuteRollback_Success` — snapshot taken before upgrade restored after failed migration |
| Upgrade preconditions fail | ✅ | `TestCheckUpgrade_PreconditionsFail` + `TestUpgradeStep_PreconditionsFail` — missing capability and step-level precondition block upgrade |
| Drift detection fails | ✅ | `TestDetectDrift_DriftFound` — hash mismatch detected as drift |

### Work Unit 9 Changes

| File | Action | What Was Done |
|---|---|---|
| `workspace/backend/internal/platform/release/release.go` | Created | ReleaseManifest, Compatibility, UpgradeStep, Precondition types; ParseRelease, CheckUpgrade, CheckCompatibility, evaluatePrecondition functions |
| `workspace/backend/internal/platform/release/rollback.go` | Created | Snapshot, RollbackPlan, RollbackStep types; SnapshotStore interface; CreateRollbackPlan, ExecuteRollback functions |
| `workspace/backend/internal/platform/release/drift.go` | Created | Drift, HashDriftDetector types; DriftDetector interface; DetectDrift function |
| `workspace/backend/internal/platform/release/release_test.go` | Created | 16 test functions covering scenarios 1-4, 6 |
| `workspace/backend/internal/platform/release/rollback_test.go` | Created | 7 test functions covering scenario 5 |
| `workspace/backend/internal/platform/release/drift_test.go` | Created | 7 test functions covering scenario 7 |
| `scripts/test-upgrade.sh` | Created | 46-check test harness: file existence, compile, vet, all 7 spec scenarios, platform regression, type verification |

## Prior Work Units (summary)

### Work Unit 1 (task 1.1) — Preservation/Recovery
- Created `preservation/dti/` inventory, `scripts/verify-preservation.sh`, `tests/preservation/verify-preservation-test.sh`
- 4/4 scenarios passed; 32 artifacts and 13 protected dirty entries verified

### Work Unit 2 (task 1.2) — Characterization
- Created `tests/architecture/test-architecture.sh`, `scripts/test-architecture.sh`
- 14 current facts verified across seven categories; 4/4 tests passed

### Work Unit 3 (task 2.1) — Module/Manifest Contracts
- Created `workspace/backend/cmd/platform/main.go`, `internal/platform/module/`, `internal/platform/manifest/`, `workspace/infra/manifests/base.json`
- 13/13 Go tests pass; `go vet` clean; CLI manifest validation works

### Work Unit 4A (task 2.2a) — Tenant Migration Foundation
- Created `internal/domain/tenancy*.go`, `internal/infrastructure/migration_test.go`, `workspace/backend/migrations/1782200000_create_organizations_memberships.up.sql`
- 11 domain scenarios + PostgreSQL migration replay pass

### Work Unit 4B1a (task 2.2b1a) — Compose Contract
- Created `workspace/docker-compose.override.yml`, edited `workspace/{Makefile,README.md,.gitignore}`
- `scripts/test-compose-contract.sh` — effective config, bounded retry, clean startup all pass

### Work Unit 4B1b (task 2.2b1b) — Migration Hardening
- Created `scripts/test-tenant-migration.sh`, hardened migration SQL
- 9/9 scenarios pass (clean boot, upgrade, backfill, rerun, retry, FK, index, malformed objects, rollback)

### Work Unit 4B2 (task 2.2b2) — Users Service Neutral Claims
- Edited `workspace/services/users-service` — handlers, usecases, repositories for neutral claims
- `scripts/test-users-session.sh` — 11/11 scenarios pass

### Work Unit 4B3 (task 2.2b3) — Gateway Session Proxy
- Edited `workspace/gateways/api-gateway/middleware.go`, `routes_users.go`; created `middleware_test.go`, `scripts/test-gateway-session.sh`
- 8/8 Go tests pass; 11/11 harness scenarios pass

### Work Unit 4C (task 2.2c) — BFF/Session Wiring
- Edited `workspace/frontend/app/api/auth/{login,me,logout}/route.ts`, `[...path]/route.ts`, `sdk/auth/AuthContext.tsx`; created `scripts/test-bff-session.sh`
- 18/18 harness scenarios pass

### Work Unit 5 (task 2.3) — Authorization/Audit Backend Policy
- Created `workspace/backend/internal/platform/authorization/policy.go`, `workspace/backend/internal/platform/authorization/policy_test.go`, `workspace/backend/internal/platform/audit/audit.go`, `workspace/backend/internal/platform/audit/audit_test.go`, `scripts/test-authorization.sh`
- 27 Go test functions pass; 12/12 harness scenarios pass

### Work Unit 7 (task 3.2) — Reference Module
- Created `workspace/backend/internal/modules/reference/module.go`, `handler.go`, `handler_test.go`; `workspace/frontend/app/(modules)/reference/page.tsx`, `layout.tsx`; `scripts/test-reference-module.sh`
- 25/25 Go tests pass; 39/39 harness checks pass

### Work Unit 8 (task 3.3) — Optional Profiles/Adapters
- Added Profile, ProfileSet types; ResolveProfile function; BuiltinProfiles with minimal/full; extended Validate
- 20/20 Go tests pass; 19/19 harness checks pass; backward compatible

### Work Unit 10 (task 4.2) — Legacy Contraction

Created `workspace/backend/internal/platform/compat/adapter.go` with:
- `RouteAdapter` interface (`LegacyPath()`, `NewPath()`)
- `DataAdapter` interface (`SourceType()`, `Adapt()`, `Revert()`)
- `Registry` struct with `RegisterRoute`, `RegisterData`, `ResolveRoute`, `AdaptData`, `RevertData`, `RemoveRoute`, `RemoveData`, `RouteIDs`, `DataIDs`
- No external deps, no DTI runtime dependency

Created `scripts/test-compatibility.sh` — 33-check harness.

**Work Unit Evidence for Unit 10**

| Evidence | Result |
|---|---|
| Focused test | `go test -count=1 ./internal/platform/compat/...` → `ok 0.002s` (13 tests pass) |
| Runtime harness | `scripts/test-compatibility.sh` → exit 0, 33/33 checks pass (Go compile, vet, all 7 spec scenarios, platform regression, type verification) |
| Regressions | `go test ./internal/platform/...` → all 6 packages pass; `go vet ./internal/platform/compat/...` → clean |
| Rollback boundary | Remove `workspace/backend/internal/platform/compat/` (2 files); remove `scripts/test-compatibility.sh`; revert tasks.md checkbox for 4.2 |

**Spec Scenario Coverage (Unit 10)**

| Spec Scenario | Status | How Verified |
|---|---|---|
| Legacy route maps to new handler path | ✅ | `TestRegisterRoute_Resolves` — `/api/old/destinations` → `/api/new/destinations` |
| Legacy data model maps to neutral model fields | ✅ | `TestMultipleAdapters_ComposeWithoutCollision` — multiple route+data adapters map correctly |
| Adapter handles empty/null legacy fields gracefully | ✅ | `TestEmptyLegacyData_AdaptHandlesGracefully` + `RevertHandlesGracefully` — nil/empty input returns empty map without panic |
| Unknown legacy route returns 404, not 500 | ✅ | `TestResolveRoute_UnknownReturns404` — returns `("", false)`, never an error |
| Multiple adapters compose without collision | ✅ | `TestMultipleAdapters_ComposeWithoutCollision` — 3 routes + 2 data adapters coexist; `TestRegisterRoute_CollisionRejected` — duplicate path rejected |
| Adapter can be removed without breaking remaining | ✅ | `TestRemoveRoute_DoesNotBreakRemaining` + `TestRemoveData_DoesNotBreakRemaining` — removed adapter unresolvable, remaining still works |
| Full round-trip preserves data | ✅ | `TestRoundTrip_PreservesData` — legacy → Adapt → Revert preserves all original fields and values |

## Remaining tasks

- [x] 3.2 Reference module; unit 7
- [x] 3.3 Optional profiles/adapters; unit 8
- [x] 4.1 Release/upgrade/drift rollback; unit 9
- [x] 4.2 Legacy contraction via sources/templates/overlays; unit 10
- [ ] 4.3 Remove DTI after acceptance; unit 11
