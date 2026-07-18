# Module Composition Specification

## Purpose

Module boundaries.

## Requirements

### Requirement: Registered ownership and isolation

Modules MUST register owned routes, permissions, migrations, navigation, jobs, health, and optional dependencies. They MUST isolate data and MUST NOT support arbitrary runtime plugins.

#### Scenario: Invalid registration fails closed

- GIVEN a conflicting or boundary-crossing module
- WHEN composition is validated
- THEN activation MUST fail and identify the violation

### Requirement: Neutral reference and scope

The base MUST include a neutral reference module proving registration, tenant data, permissions, health, and removal. It MUST NOT define legal clients, cases, documents, TipTap, DOCX/PDF, DTI workflows, or product contracts.

#### Scenario: Reference module proves composition

- GIVEN the reference module is included and entitled
- WHEN an authorized tenant invokes it
- THEN route, navigation, operation, audit, and health MUST be observable
- AND active contracts MUST contain no excluded concept
