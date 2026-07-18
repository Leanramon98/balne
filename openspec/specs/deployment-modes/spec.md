# Deployment Modes Specification

## Purpose

Deployment equivalence.

## Requirements

### Requirement: Code-identical deployment modes

SaaS and dedicated modes MUST use identical product code. Deployment composition MUST select modules; runtime entitlements MUST control access without loading absent modules.

#### Scenario: Equivalent module behavior

- GIVEN equivalent SaaS and dedicated deployments
- WHEN the same operation runs
- THEN authorization, tenancy, audit, and results MUST match

#### Scenario: Disabled or absent module

- GIVEN an absent or unentitled module
- WHEN its operation is requested
- THEN access MUST fail without exposing data or navigation

### Requirement: Capability profiles

Identity, tenancy, RBAC, audit, configuration, and entitlements MUST be mandatory. Storage, messaging/jobs, notifications, and observability MUST be optional; absence MUST NOT break independent behavior.

#### Scenario: Optional capability is absent

- GIVEN optional capabilities are absent
- WHEN core and an independent module run
- THEN they MUST succeed without those capabilities

#### Scenario: Declared dependency is missing

- GIVEN a module requires an absent capability
- WHEN composition is validated
- THEN startup MUST fail before traffic and identify the dependency
