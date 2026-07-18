# Base Lifecycle Specification

## Purpose

Lifecycle evidence.

## Requirements

### Requirement: Controlled versioned upgrades

Releases MUST identify version, compatibility, controlled upgrades, migrations, preconditions, rollback, and limits. Failed migration MUST restore prior state.

#### Scenario: Upgrade rollback is rehearsed

- GIVEN a supported consumer snapshot
- WHEN an upgrade migration fails
- THEN rollback MUST restore prior code and data

### Requirement: Reproducible preservation evidence

Outputs MUST reproduce from versioned schemas, templates, tools, and commands; drift MUST fail. DTI history, migrations, and generator sources MUST remain recoverable from immutable Git or archive; active structure MUST contain no DTI product. Acceptance MUST execute evidence for isolation, RBAC denial, disabled modules, optional-capability absence, both modes, rollback, and generation; documentation alone MUST NOT pass.

#### Scenario: Generated drift blocks acceptance

- GIVEN a clean release checkout
- WHEN declared generation runs
- THEN any diff MUST fail and identify drift

#### Scenario: Neutral release evidence is complete

- GIVEN a candidate and DTI reference
- WHEN acceptance evidence is evaluated
- THEN every behavior MUST pass a reproducible check
- AND active DTI MUST be absent while the reference remains recoverable
