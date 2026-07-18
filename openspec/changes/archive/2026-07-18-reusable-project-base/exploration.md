## Exploration: Reusable Project Base

### Current State
The repository is a complete Auto-Insight DTI product, not yet a neutral foundation. Its reusable assets are valuable, but platform and product concerns are interleaved from UI navigation through JWT claims, generated contracts, gateway routes, database schemas, seeds, tests, infrastructure names, documentation, and OpenSpec artifacts.

The current request path is Browser → Next.js BFF → Go/Echo gateway → Go services. The frontend uses App Router, Atomic Design, an SDK boundary, SWR, shadcn/ui, Playwright, and route groups. The backend uses hexagonal Go services, generated contracts, PostgreSQL schema-per-service, RabbitMQ, MinIO, OpenTelemetry, Jaeger, Prometheus, health checks, and Docker Compose. Those patterns are reusable; the concrete evaluation domain and much of the identity model are DTI-specific.

| Area | Keep in reusable base | Move to DTI product layer or remove |
|---|---|---|
| Frontend | App Router shell contract, UI primitives, SDK/BFF boundary, auth pages, error/loading patterns, i18n mechanism, generic admin/profile surfaces | `(dti)` routes, `DtiShell`, destination pill/logo/branding, evaluation/action/plan/results/good-practice components, maps, DTI messages and E2E fixtures |
| Identity | Login, password lifecycle, profiles, users, generic roles/permissions, audit capability, email and session ports | `DestinationID`, DTI role names, evaluation/good-practice permission fields, DTI welcome copy and seeds |
| Gateway/BFF | Same-origin BFF, token forwarding, reverse-proxy boundary, health/security middleware concepts | Hard-coded evaluations routes, service names/ports, DTI public-path list and generated DTI route table |
| Backend | Hexagonal module shape, repository/use-case/adapter conventions, UUID/time/error conventions, migration discipline, event ports | Entire evaluations business domain: destinations, catalogs, scopes, indicators, workflows, actions, plans, reports, translations, and good practices |
| Contracts | Schema-first generation workflow and generated-file safeguards | Current users/evaluations schemas, generated DTI TypeScript/protobuf contracts and DTI RBAC constants |
| Data | PostgreSQL, migration tooling, transaction conventions, separate schemas where justified | Evaluation schema, catalog seeds, destination foreign concepts, DTI roles/data, product-specific Postman data |
| Infrastructure | Compose profiles, PostgreSQL, optional RabbitMQ/MinIO/telemetry, health checks, environment templates, reverse proxy | Auto-Insight names/images/network/bucket, unconditional evaluations deployment, DTI init scripts and seeds |
| Tests | Go unit/integration conventions, Testcontainers pattern, Playwright harness, API cleanup pattern, strict TDD and quality commands | DTI scenarios, roles, catalogs, fixtures and snapshots; tests tied to the monolithic evaluation repository interface |
| Agents/SDD/docs | Layered `AGENTS.md`, backend-first/API-through-SDK rules, generated-file protection, hybrid OpenSpec+Engram workflow, 400-line review guard | Auto-Insight terminology, DTI route/entity instructions, stale claims such as frontend Jest support not present in dependencies, and 17 DTI source specs |
| CI/tooling | Make targets and generators as concepts | No CI workflows currently exist; root tooling is incomplete and generated Compose cannot be safely hand-edited |

Important coupling findings:

- `users-service` is only partly reusable: DTI fields and permissions are embedded in entities, JWT claims, schema input, migrations, generated contracts, email content, integration tests, and role seeds.
- The gateway performs authentication but its RBAC check is a TODO, while generated frontend guards decode a token from `localStorage`. The BFF also uses an HTTP-only cookie, so authorization behavior is duplicated and client guards must not be treated as security controls.
- There are two frontend `AuthContext` implementations. The generated guard and the SDK context also create a generated/user-owned seam that must be resolved through generator inputs rather than direct edits.
- `evaluations-service` is a large DTI bounded context with a broad repository interface and direct frontend/gateway/test coupling. Its hexagonal structure is reusable; its domain code and data are not a suitable generic module.
- Observability infrastructure is only partially wired: OTLP traces are configured to Jaeger, but Prometheus has no shown scrape configuration and the collector has no metrics pipeline. The gateway also lacks equivalent telemetry wiring.
- Infrastructure and contracts contain generated files (`docker-compose.yml`, `*_generated.go`, generated TypeScript/protobuf, generated SQL). Extraction must change generator schemas/templates or add user-owned overlays; generated outputs must never be edited directly.
- Existing OpenSpec source specs are DTI capabilities. They should remain historical/product artifacts during migration, not be silently relabeled as platform specifications. The active `audit-log-full-tracking` change must remain untouched and be reconciled explicitly with the future platform audit module.
- No CI workflow, frontend unit-test runner dependency, frontend coverage command, Go linter configuration, or coverage threshold was detected. The reusable base should not claim those capabilities until they are added and proven.

### Affected Areas
- `AGENTS.md`, `workspace/**/AGENTS.md` — split durable engineering rules from DTI domain guidance and correct stale testing/tooling claims.
- `workspace/frontend/app/`, `components/`, `sdk/`, `types/`, `messages/`, `tests/e2e/` — establish a generic application shell and module contributions; move DTI screens, types, copy, fixtures, and branding out of the base.
- `workspace/frontend/app/api/` — retain the BFF boundary, consolidate auth/session handling, and separate generic proxying from product-specific local APIs such as help-center and evidence upload.
- `workspace/services/users-service/` — extract generic identity/audit behavior from destination-scoped claims, roles, migrations, templates, and tests.
- `workspace/services/evaluations-service/` — treat as a removable DTI product module; preserve architectural patterns as a module template rather than genericizing DTI entities.
- `workspace/gateways/api-gateway/` — replace DTI route registration and fixed upstreams with module-owned registration/configuration while preserving authentication, proxy, and health patterns.
- `workspace/shared-contracts/` and service `schema.yaml` files — separate platform contracts from product contracts and regenerate outputs from neutral schemas.
- `workspace/services/**/migrations/`, `workspace/infra/init*.sql` — create a clean baseline instead of mutating historical DTI migrations; retain history on a preservation branch/tag.
- `workspace/infra/` and `workspace/Makefile` — introduce neutral naming and optional Compose profiles for broker, object storage, and observability; add truthful build/test/quality targets.
- `docs/`, `openspec/specs/`, `openspec/changes/` — create platform documentation/specs without rewriting DTI history or touching `audit-log-full-tracking`.
- CI/tooling root — add a future CI matrix for frontend build/type/lint/E2E and Go test/vet only after commands are reproducible; preserve generator validation as a first-class check.

### Approaches
1. **Template repository with a modular-monolith product host** — distribute a neutral starter repository; run identity, audit, configuration, files, and product modules in one backend process initially, with explicit module interfaces and optional BFF/gateway deployment.
   - Pros: Lowest operational cost for new products; customer modules can be composed without network boundaries; transactions and local development remain simple; module ports preserve later extraction; template delivery makes the base a first-class product.
   - Cons: Requires deliberate restructuring from the current two-service/generated shell; module boundaries need enforcement; the gateway may be redundant in small deployments.
   - Effort: High

2. **Retain the current microservice shell and replace evaluations-service per product** — keep users-service, gateway, messaging, schemas, and deployment topology, then add legal services beside them.
   - Pros: Preserves the most code and current deployment/call flow; service isolation and observability topology already exist.
   - Cons: Carries DTI leakage in identity/contracts; imposes RabbitMQ, gateway, multiple processes, and distributed failure modes before scale demands them; per-customer feature combinations become deployment orchestration rather than modular composition.
   - Effort: Medium

3. **Strip DTI in place and clone the repository for each product** — rename/remove domain files while leaving architecture mostly unchanged.
   - Pros: Fastest apparent path and minimal conceptual redesign.
   - Cons: Creates a snapshot rather than a maintained foundation; future fixes diverge across clones; generated artifacts and migration history are easy to corrupt; feature toggles tend to become scattered conditionals.
   - Effort: Medium initially, High over time

### Recommendation
Choose **Approach 1: a template repository whose default runtime is a modular monolith**, while retaining the BFF and gateway patterns as deployable seams rather than mandatory microservice fragmentation.

The base should provide:

- A neutral frontend application shell, design system, SDK/BFF contract, authentication/session UI, module-aware navigation, localization mechanism, and test harness.
- A platform backend with modules for identity/RBAC, audit, configuration/feature entitlements, notifications/email ports, and optionally file/object metadata. Keep RabbitMQ, MinIO, and distributed telemetry behind optional Compose profiles or adapters.
- A module registry. Each module owns its routes, permissions, migrations, navigation contributions, background jobs, and health checks. Enable modules through a validated deployment manifest; evaluate customer entitlements centrally. Prefer build/deploy-time composition for structural modules and runtime entitlements for licensed access. Do not use arbitrary dynamic plugins or scatter environment-variable checks through business code.
- Stable extraction rules: modules communicate through application ports and versioned events, never each other's tables. A module becomes a microservice only when independent scaling, security isolation, ownership, availability, or deployment cadence justifies the operational cost.
- A maintained template release process with upgrade notes, generator drift checks, architecture tests, and a small reference/sample module. The legal product consumes the base and owns `clients`, `matters/cases`, legal parties, deadlines, billing if needed, and legal document workflows.

Migration should be additive and git-safe:

1. Tag or branch the current DTI product state and inventory generated files and their source schemas/templates. Keep the existing working tree and `audit-log-full-tracking` change untouched.
2. Define platform boundaries and characterization tests before moving code. Add neutral module contracts beside current DTI paths.
3. Extract generic identity by replacing `DestinationID` and DTI permission fields with neutral organization/tenant membership and permission identifiers. Migrate schema inputs first, then regenerate outputs; never patch generated artifacts.
4. Introduce the neutral shell/module registry and move DTI frontend/backend/contracts/migrations into an isolated product layer in reviewable slices. Use expand/migrate/contract database changes and reversible compatibility adapters.
5. Create a fresh neutral database baseline for new products. Preserve old DTI migrations for DTI upgrades/audit history; do not replay product seeds in the base.
6. Neutralize infrastructure names and make optional capabilities profile-driven. Add CI only with commands that pass in a clean checkout.
7. Prove the base by creating the legal product layer and one small sample module without copying platform internals.

For legal documents, keep legal behavior outside the base initially. Browser-authored rich text and high-fidelity DOCX are different authoring models: HTML/editor JSON does not reliably round-trip Word sections, styles, headers/footers, numbering, fields, pagination, or tracked changes. The legal layer should therefore define explicit template types and rendering paths—browser-native rich text for web-authored documents, and DOCX-first templates plus a controlled conversion/rendering worker for fidelity-critical output and PDF. Store source template, immutable version, merge-data snapshot, renderer/version, output hashes, and generated artifacts for reproducibility and audit. The base may expose generic file storage, background-job, audit, and rendering-port abstractions only; a generic document-template module should be promoted into the base after a second non-legal use case proves a stable shared model.

### Risks
- Generated code currently owns gateway, service, contract, SQL, auth-guard, and Compose surfaces; changing outputs instead of generator inputs would be overwritten or create drift.
- Neutralizing identity is a data-contract migration, not a rename: JWTs, cookies, BFF behavior, roles, tests, generated contracts, and destination-linked records must transition together.
- A broad rewrite could exceed the 400-line review budget many times over. Proposal/design/tasks should mandate chained, independently verifiable migration slices and explicit compatibility periods.
- Moving directly to microservices would preserve accidental boundaries and increase per-customer operational complexity; a modular monolith without architecture tests could instead decay into a coupled monolith.
- Removing DTI files before characterization can discard reusable UI primitives or hidden business-independent adapters; genericity should be proven by dependency direction, not filename.
- Existing documentation overstates testing and observability capabilities. Treat docs as hypotheses until clean-checkout CI validates them.
- Rich-text-to-DOCX promises can create irreversible fidelity expectations. Template format, renderer support matrix, sandboxing, font availability, and deterministic audit requirements must be specified in the legal product.
- Template-repository consumers can drift. A release/update strategy is required if platform fixes must propagate to products.

### Ready for Proposal
Yes. The proposal should establish the reusable foundation as a versioned template product, select a modular-monolith default with optional gateway/infrastructure profiles, define the base-versus-DTI/legal ownership boundary, and sequence extraction through generated-source changes and compatibility slices. It should explicitly exclude implementing legal document generation in the base while reserving generic storage, job, audit, and rendering ports.
