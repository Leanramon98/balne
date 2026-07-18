# Platform Core Specification

## Purpose

Neutral core.

## Requirements

### Requirement: Neutral tenant-aware core

The base MUST provide identity, memberships, tenant-scoped configuration, and entitlements. SaaS MUST isolate organizations; dedicated mode MUST enforce one organization.

#### Scenario: Cross-tenant access is denied

- GIVEN a principal in organization A
- WHEN it requests organization B data
- THEN access MUST fail without exposing or changing B data
- AND audit MUST identify organization A

### Requirement: Server-enforced control and accountability

The backend MUST enforce RBAC and audit protected outcomes per-organization. Failed controls MUST deny access; client state MUST NOT grant authority.

#### Scenario: Permission denial is auditable

- GIVEN a principal lacks permission
- WHEN it invokes a protected operation
- THEN the backend MUST deny it
- AND audit MUST record actor, tenant, action, outcome, time
