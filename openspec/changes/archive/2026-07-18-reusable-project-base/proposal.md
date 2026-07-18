# Proposal: Reusable Project Base

## Intent

Create a maintained, versioned foundation that avoids product-clone divergence and supports multi-tenant SaaS and dedicated deployments from identical product code.

## Goals and Scope

### In Scope
- Define a neutral shell, SDK/BFF boundary, module host, and contracts.
- Provide mandatory identity, organizations/tenancy, RBAC, audit, and configuration/module-entitlement capabilities.
- Define optional profiles for storage, messaging/jobs, notifications, and observability.
- Prove composition with one small neutral reference module.
- Establish versioned releases, upgrade notes, and controlled consumer migrations.

### Out of Scope
- Keeping DTI active; preserve it only in Git history/archive.
- Legal-practice features, rich-text authoring, or high-fidelity DOCX/PDF paths.
- Arbitrary runtime plugins, mandatory microservices, or generic ports without a demonstrated base need.

## Capabilities

### New Capabilities
- `platform-core`: Identity, tenancy, RBAC, audit, configuration, and entitlements.
- `module-composition`: Module registration, isolation, and reference-module behavior.
- `deployment-modes`: Equivalent SaaS and dedicated composition without product-code forks.
- `base-lifecycle`: Versioning, controlled updates, migrations, and preservation rules.

### Modified Capabilities
None. Existing DTI specs remain historical.

## Boundary and Approach

The base owns the shell, core capabilities, module contracts, and justified ports. Products own domain workflows, data, copy, and integrations. Modules own routes, permissions, migrations, navigation, jobs, and health. Deployment-time composition selects structural modules; central entitlements control access.

Migration is staged: preserve a DTI tag/archive and inventory generator sources; characterize behavior; add neutral contracts; change schemas/templates before regenerating; migrate core boundaries through compatibility periods; prove the reference module; then remove active DTI and create a neutral baseline. Each slice requires review-burden approval and a chained-PR decision under the 400-line budget.

## Affected Areas

| Area | Impact |
|---|---|
| `workspace/frontend`, `workspace/services`, `workspace/gateways` | Platform/module boundaries |
| `workspace/shared-contracts`, `workspace/infra` | Sources and deployment profiles |
| `docs`, `AGENTS.md`, `openspec/specs` | Guidance and specifications |

## Risks

| Risk | Mitigation |
|---|---|
| Generated-output drift | Preserve and modify source schemas/templates only |
| Identity/data breakage | Characterization, compatibility periods, reversible slices |
| Base/product coupling or consumer drift | Boundary specs, reference proof, versioned migration notes |

## Rollback and Preservation

Retain the DTI tag/archive, migrations, and generator sources. Roll back stages to checkpoints while compatibility paths remain; never rewrite DTI history or alter `audit-log-full-tracking`.

## Dependencies

- Generator-source inventory and reproducible baselines.

## Success Criteria

- [ ] Mandatory core and module boundaries are specified without DTI concepts.
- [ ] The neutral module runs in SaaS and dedicated modes from identical code.
- [ ] A documented controlled update can be rehearsed and rolled back.
- [ ] DTI remains recoverable from Git/archive but absent from the active base.
- [ ] Generated artifacts remain reproducible from preserved sources.
