# Tasks: Reusable Project Base

## Review Workload Forecast

Authored lines: **4,580–5,850** across **16 slices**; **4B1a** 280–360, **4B1b** 340–400, **4B2** 340–400, **4B3** 260–340. `review-35ea4388fb7d53de` forced B1 split for ≤400. Progress: **10/16** through 4C; 4B1a receipt `review-c82dd791622fda4f` validates allow. Next: **6 / 3.1**.

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Chain: tracker integrates; PR1→tracker; children→predecessors; tracker-only→main.

### Work Units

| Unit | Focused test | Runtime evidence | Rollback |
|---|---|---|---|
| 4B1a | `scripts/test-compose-contract.sh` | documented `make up` | override/init wiring |
| 4B1b | `scripts/test-tenant-migration.sh` | clean/upgrade/rerun/rollback — 9/9 passed | migration/backfill |
| 4B2 | `scripts/test-users-session.sh` | users HTTP + PostgreSQL | session integration |
| 4B3 | `scripts/test-gateway-session.sh` | gateway→users HTTP | session proxy |
| 4C | `npm run test:e2e -- neutral-session` | Playwright login | BFF/session |
| 5 | `scripts/test-authorization.sh` | denied HTTP | policy/audit |
| 6 | `scripts/test-neutral-shell.sh` | 24/25 structural checks (tsc unavailable) | shell/contributions |
| 7 | `scripts/test-reference-module.sh` | CRUD/Playwright | reference module |
| 8 | `scripts/test-profiles.sh` | minimal/full manifests | profiles/adapters |
| 9 | `scripts/test-upgrade.sh` | injected failure | releases/checkpoints |
| 10 | `scripts/test-compatibility.sh` | old/new matrix | legacy adapters/routes |
| 11 | `scripts/test-neutral-release.sh` | both-mode boot | DTI removal/baseline |

## Phase 1: Preservation/Characterization

- [x] 1.1 Preserve DTI/source-output recovery; unit 1.
- [x] 1.2 Characterize login/BFF/proxy/tenant/migration/generation; unit 2.

## Phase 2: Foundation

- [x] 2.1 Platform module/manifest contracts; unit 3 receipt `review-e8f800d2e38863ea`.
- [x] 2.2a Organization/Membership/`TenantContext` migration foundation; unit 4A receipt `review-c82dd791622fda4f`; not production-complete.
- [x] 2.2b1a **P:** 2.2a; add user-owned `workspace/docker-compose.override.yml`; edit `workspace/{Makefile,README.md,.gitignore}` exception so `make up`/tests resolve identical Compose files. RED missing override/retry/dependency; GREEN bounded psql backoff after PostgreSQL init and users-service waiting for migration success; REFACTOR commands. **V/RB:** 4B1a.
- [x] 2.2b1b **P:** 2.2b1a; harden `workspace/backend/migrations` and runtime harness. RED clean boot, existing-volume upgrade/backfill, rerun, retry, wrong-schema-FK, cross-schema same-name index, malformed target objects, transaction rollback/cleanup; GREEN deterministic backfill and schema-qualified OID/definition-exact non-wildcard FK/constraint/index operations. Tests invoke documented `make up` or its exact Makefile command. **V/RB:** 4B1b.
- [x] 2.2b2 **P:** 2.2b1b; wire `workspace/services/users-service` handlers/use-cases/repositories to signed neutral claims. RED neutral/legacy/dual/conflict, DB errors→5xx, identity denial→4xx, JWT roles/permissions ignored; GREEN production login/session; REFACTOR mapping. **V/RB:** 4B2.
- [x] 2.2b3 **P:** 2.2b2; add user-owned `workspace/gateways/api-gateway` session proxy. RED route/header/claims/denial/errors; GREEN actual gateway→users HTTP; REFACTOR wiring. **V/RB:** 4B3.
- [x] 2.2c **P:** 2.2b1a–b3; wire `workspace/frontend/{app/api,sdk}` BFF/login/session. RED conflict/fail-closed/client authority; GREEN production tenant-context traversal; REFACTOR mapping. **V/RB:** 4C.
- [x] 2.3 **P:** 2.2a, 2.2b1a–b3, 2.2c; add `workspace/backend/internal/platform/{authorization,audit}`. RED forged authority/denial; GREEN fail-closed policy/audit; REFACTOR middleware. **V/RB:** 5.

## Phase 3: Composition

- [x] 3.1 Neutral shell/module contributions; unit 6.
- [x] 3.2 Reference module; unit 7.
- [x] 3.3 Optional profiles/adapters; unit 8.

## Phase 4: Lifecycle/Contraction

- [x] 4.1 Release/upgrade/drift rollback; unit 9.
- [x] 4.2 Legacy contraction via sources/templates/overlays; unit 10.
- [x] 4.3 Remove DTI after acceptance; unit 11.

## Guards

B1 acceptance includes weak `created_at` and malformed same-name target-object handling. `core-cli` unavailable: generated changes block; never edit outputs. Protected `docs/product/**`: do-not-read/modify/baseline/include. Users-service tests claim no gateway/BFF reachability. Preserve descriptor-copy and parameterized-route follow-ups.
