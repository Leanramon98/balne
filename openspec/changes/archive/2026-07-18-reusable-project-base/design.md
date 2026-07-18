# Design: Reusable Project Base

## Technical Approach

Publish a versioned template whose default runtime is a Go modular monolith, PostgreSQL, and a neutral Next.js shell/BFF. Preserve current hexagonal, SDK, App Router, and Atomic Design seams; keep gateway and infrastructure adapters optional. A validated deployment manifest selects compiled modules; runtime entitlements only deny access. DTI remains recoverable by immutable tag/archive, never active.

## Target Architecture and Data Flow

```text
Browser -> Next.js shell/BFF -> [optional gateway] -> platform host
                                                   |-> mandatory core
                                                   |-> reference/product modules
                                                   `-> optional adapters
SaaS: many organizations/database; Dedicated: one configured organization/same binary
```

The frontend host accepts typed navigation, route metadata, SDK, localization, and entitlement contributions. Modules own `app/(modules)/<module>` and cannot import peers; UI primitives, shell, auth/session, and `sdk/platform` remain neutral.

Each backend `Module` declares unique routes, permission IDs, ordered migrations, jobs, versioned events, health, and required capabilities. It owns its schema and repositories; cross-module table access is forbidden. Core owns principals, organizations, memberships, tenant resolution, authorization, audit, configuration, and entitlements. `TenantContext{OrganizationID, PrincipalID, MembershipID, DeploymentMode}` comes from the authenticated session and requested organization; dedicated mode validates one configured organization. Handlers check policy before use cases; JWT contains neutral subject/session IDs, not DTI roles, permissions, or `DestinationID`. Denials fail closed and are audited.

Mandatory core uses PostgreSQL and in-process jobs/audit. Profiles enable optional `storage`, broker-backed `messaging/jobs`, `notifications`, and `observability`; declared missing dependencies fail before readiness.

Legal behavior, clients/cases, TipTap, DOCX/PDF, and arbitrary runtime plugins are out of scope; generic ports require a demonstrated base need.

## Architecture Decisions

| Decision | Alternatives / tradeoff | Choice and rationale |
|---|---|---|
| Runtime topology | Existing microservices preserve code but impose distributed operations | Modular monolith first; explicit ports permit later extraction for scaling/isolation. |
| Composition | Runtime plugins maximize flexibility but weaken reproducibility | Compile/deploy-time registry plus manifest; no arbitrary loading. Entitlements govern runtime access only. |
| Tenancy | Separate product forks simplify dedicated mode but drift | Organization-scoped rows and membership policy in identical code; dedicated mode constrains cardinality. |
| Identity authority | Client JWT guards are convenient but forgeable/stale | HTTP-only session/BFF and backend authorization; UI guards only hide navigation. |
| Lifecycle | Clone-and-patch is fast but diverges | SemVer template releases, machine-readable upgrade manifests, compatibility windows, and drift gates. |

## Interfaces and Files

| Path | Action | Responsibility |
|---|---|---|
| `workspace/backend/cmd/platform/main.go` | Create | Compose host, validate manifest, expose readiness. |
| `workspace/backend/internal/platform/{identity,organizations,authorization,audit,configuration,entitlements}` | Create | Mandatory neutral core. |
| `workspace/backend/internal/platform/module/contract.go` | Create | `Module`, capability, ownership, and registry contracts. |
| `workspace/backend/internal/modules/reference` | Create | Tenant-scoped “notes” CRUD proving route, permission, migration, audit, health, navigation, and clean removal. |
| `workspace/frontend/app/(modules)`, `components/templates/AppShell.tsx`, `sdk/platform` | Create | Neutral shell and contribution boundary. |
| `workspace/contracts/schemas`, `workspace/infra/manifests`, `workspace/infra/profiles` | Create | Generator inputs, deployment composition, optional adapters. |
| `releases/manifest.schema.json`, `releases/upgrades/<from>-<to>.yaml` | Create | Preconditions, migration order, compatibility, checkpoints, rollback, tool versions/hashes. |
| `workspace/{frontend,services,gateways,shared-contracts,infra}` | Migrate/remove | Replace active DTI topology in staged slices; generated outputs change only by versioned schemas/templates or user-owned overlays and regeneration. |

## Testing Strategy

First freeze characterization for login/BFF, proxy routes, tenant headers, migrations, generation, and DTI recovery. Strict-TDD architecture tests reject registration collisions, cross-module imports/tables, missing capabilities, and excluded terms. Unit/integration tests prove isolation, auditable denial, dedicated cardinality, disabled modules, adapter absence, startup failure, and removal. Playwright runs both profiles. Acceptance regenerates with pinned tools and fails on diff; upgrade tests inject failure and restore code/data checkpoints.

## Threat Matrix

| Boundary | Applicability | Safe/failure behavior and RED tests |
|---|---|---|
| Documentation-like paths | N/A — no executable classification | No task. |
| Git repository selection | N/A — no Git command integration | No task. |
| Commit state | N/A — no commit automation | No task. |
| Push state | N/A — no push automation | No task. |
| PR commands | N/A — no PR automation | No task. |

## Migration / Rollout

Independent slices: (1) tag/archive DTI and inventory generator source/output hashes; (2) add characterization and architecture RED tests; (3) add contracts/manifest validator; (4) expand organization/membership schema and neutral claims, then compatibility adapters; (5) enforce backend policy/audit; (6) add neutral shell; (7) add reference module; (8) add optional profiles; (9) rehearse upgrade/rollback and generation; (10) contract old schemas/routes; (11) remove active DTI and create a fresh neutral baseline. Every slice has its own rollback checkpoint and review; this program necessarily uses chained PRs and does not claim a 400-line total.

Compatibility supports current and next base minor versions during each migration window; unsupported drift or modified generated output blocks upgrade. `audit-log-full-tracking`, dirty files, DTI migrations, and product history remain untouched.

## Open Questions

None blocking task decomposition.
