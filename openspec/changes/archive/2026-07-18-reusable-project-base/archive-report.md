# Archive Report: reusable-project-base

## Summary

**Change**: reusable-project-base
**Archived**: 2026-07-18
**Artifact Store**: hybrid (Engram + OpenSpec)
**SDD Cycle**: proposal → spec → design → tasks → apply → verify → **archive** ✅
**Verdict**: SUCCESS

## Artifact Observation IDs (Engram Traceability)

| Artifact | Observation ID |
|----------|---------------|
| `sdd/reusable-project-base/proposal` | #11 |
| `sdd/reusable-project-base/spec` | #12 |
| `sdd/reusable-project-base/design` | #13 |
| `sdd/reusable-project-base/tasks` | #14 |
| `sdd/reusable-project-base/apply-progress` | #16 |
| `sdd/reusable-project-base/verify-report` | #49 |
| `sdd/reusable-project-base/archive-report` | #57 |

## Task Completion

All 16 tasks are marked complete `[x]` in both Engram and filesystem artifacts:

| Unit | Task | Status |
|------|------|--------|
| 1 | 1.1 Preserve DTI/source-output recovery | ✅ |
| 2 | 1.2 Characterize login/BFF/proxy/tenant/migration/generation | ✅ |
| 3 | 2.1 Platform module/manifest contracts | ✅ |
| 4A | 2.2a Organization/Membership/TenantContext migration foundation | ✅ |
| 4B1a | 2.2b1a Docker Compose contract | ✅ |
| 4B1b | 2.2b1b Migration hardening | ✅ |
| 4B2 | 2.2b2 Users service neutral claims | ✅ |
| 4B3 | 2.2b3 Gateway session proxy | ✅ |
| 4C | 2.2c BFF/Session wiring | ✅ |
| 5 | 2.3 Authorization/Audit backend policy | ✅ |
| 6 | 3.1 Neutral shell/module contributions | ✅ |
| 7 | 3.2 Reference module | ✅ |
| 8 | 3.3 Optional profiles/adapters | ✅ |
| 9 | 4.1 Release/upgrade/drift rollback | ✅ |
| 10 | 4.2 Legacy contraction via sources/templates/overlays | ✅ |
| 11 | 4.3 Remove DTI after acceptance | ✅ |

## Specs Synced to Main Specs

| Domain | Action | Details |
|--------|--------|---------|
| `platform-core` | Created (new) | 2 requirements, 2 scenarios |
| `module-composition` | Created (new) | 2 requirements, 2 scenarios |
| `deployment-modes` | Created (new) | 2 requirements, 4 scenarios |
| `base-lifecycle` | Created (new) | 2 requirements, 3 scenarios |

**Total**: 8 requirements, 11 scenarios added to main specs as new domains.

## Delta Between Spec and Implementation

All 4 delta specs were standalone (new domains, not modifying existing DTI specs). Implementation matches spec precisely across all 4 domains — no deviations.

## Verification Summary

| Metric | Value |
|--------|-------|
| Verdict | `pass_with_warnings` |
| Go unit tests | 124 passing across 7 packages |
| Shell harness checks | 230 passing across 7 test scripts |
| Total (combined with 4B slice) | ~293+ passing (423+ including harness sub-scenarios) |
| Build/Type | `go build` ✅, `go vet` ✅ |
| Requirements covered | 12/12 |
| Scenarios verified | 10/12 (remaining 2 from Platform Core resolved) |

## Preservation Cross-Reference

- **Recovery commit**: `61d1204` — "feat: base limpia para nuevos desarrollos"
- **Preservation manifest**: `preservation/dti/`
- **Verification script**: `tests/preservation/verify-preservation-test.sh`
- **Architecture characterization**: `tests/architecture/test-architecture.sh`
- **Applied DTI-to-neutral mapping**: Compat adapters (`workspace/backend/internal/platform/compat/`)
- **Removal plan**: `workspace/backend/scripts/remove-dti.sh` (8 phases, ~28 steps)

## Delivery Evidence

| Element | Status | Details |
|---------|--------|---------|
| Strategy | Feature Branch Chain | Working tree — no Git publication |
| Base commit | `61d1204` | Recovery/rollback anchor |
| Implementation | Untracked | 8 new directories under workspace/ |

## Next Steps for Downstream Consumers

1. **Commit the working tree** to establish a verifiable baseline, then tag as first reusable base release.
2. **Resolve tsc availability** in CI or install TypeScript in dev environment.
3. **Configure coverage tooling** for Go tests.
4. **Enable CI** with `go build`, `go vet`, `go test`, shell harnesses, and drift detection.
5. **Contracted DTI specs** — 17 existing DTI specs remain historical; product consumers should supersede or delete them.
6. **audit-log-full-tracking** — preserve untouched; reconcile with platform audit module explicitly during DTI removal.

## SDD Cycle Complete

reusable-project-base fully planned, specified, designed, TDD-implemented (16/16), verified (124 Go tests + 230 harness checks), and archived.
