# AGENTS.md — Auto-Insight DTI Platform

> Global entry point for any AI agent working on this codebase. Read this first, then dive into the relevant sub-AGENTS.md.

## Project Overview

**Auto-Insight** is a DTI (Destinos de Transformación Inteligente) assessment platform. It manages:
- **Destinations** (cities/regions) with geographic coordinates, population ranges, member types
- **Evaluations** — multi-phase assessment cycles (auto-evaluación → evaluación → re-evaluación)
- **Scopes / Ámbitos** — assessment domains (GOB, INN, TEC, SOST, ACC)
- **Indicators** — measurable criteria per scope, with gradient/boolean/numeric types
- **Actions / Plan de Transformación** — improvement actions linked to indicators
- **Good Practices / Buenas Prácticas** — public showcase of completed actions
- **Results & Reports** — aggregated analytics across destinations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **BFF / Proxy** | Next.js API routes (App Router) — server-side proxy to backend |
| **API Gateway** | Go (Echo v4) — JWT validation + reverse proxy to microservices |
| **Services** | Go microservices with hexagonal architecture |
| **Database** | PostgreSQL 16 (schema-per-service via `search_path`) |
| **Messaging** | RabbitMQ (events between services) |
| **Infra** | Docker Compose |

## Monorepo Structure

```
auto-insight/
├── AGENTS.md                    ← You are here
├── workspace/
│   ├── frontend/               ← Next.js app (see frontend/AGENTS.md)
│   │   ├── app/(dti)/          ← Main DTI pages (DtiShell)
│   │   ├── app/(admin)/        ← Admin pages (AppShell — deprecated, moving to dti)
│   │   ├── app/(public)/       ← Public pages (no auth)
│   │   ├── components/         ← Atomic Design hierarchy
│   │   ├── sdk/                ← API clients, auth context, hooks
│   │   └── lib/                ← Utilities (auth.ts, display-names.ts)
│   ├── services/
│   │   ├── evaluations-service/ ← Core business logic (see service/AGENTS.md)
│   │   └── users-service/      ← Auth, RBAC, profiles (see service/AGENTS.md)
│   ├── gateways/
│   │   └── api-gateway/        ← Reverse proxy + JWT (see gateways/AGENTS.md)
│   └── infra/                  ← Docker Compose, Makefile (see infra/AGENTS.md)
├── openspec/                    ← Spec-Driven Development artifacts
└── .atl/skill-registry.md       ← Auto-generated skill registry
```

## Key Conventions

### SDD (Spec-Driven Development)
This project uses SDD. Before implementing substantial changes:
1. Check `openspec/changes/` for existing proposals
2. Follow the workflow: proposal → spec → design → tasks → apply → verify → archive
3. Use `engram` (persistent memory) + `openspec` (file artifacts) in hybrid mode

### Code Ownership
- **Generated files** (`*_generated.go`, `*_generated.css`) — NEVER edit by hand. Regenerated via `core-cli sync` or code generators.
- **User-owned files** — no suffix, created once, maintained by developers.

### Communication Flow
```
Browser → Next.js Frontend
        → BFF API Routes (App Router) → api-gateway (port 8080)
                                        → evaluations-service (port 8082)
                                        → users-service (port 8081)
```

## Domain Quick Reference

| Term | English | Description |
|------|---------|-------------|
| **Destino** | Destination | City/region being assessed (has lat/lng, country, population) |
| **Ámbito** | Scope | Assessment domain (GOB=governance, INN=innovation, TEC=technology, SOST=sustainability, ACC=accessibility) |
| **Requisito** | Requirement | A requirement within a scope |
| **Indicador** | Indicator | Measurable metric linked to a requirement |
| **Evaluación** | Evaluation | Assessment cycle with states: borrador → en_evaluacion → finalizada |
| **Acción** | Action | Improvement action in the transformation plan |
| **Buena Práctica** | Good Practice | Publicly showcaseable completed action |
| **Eje** | Axis | Top-level categorization (same values as scope) |

## Navigation

- **Frontend conventions** → `workspace/frontend/AGENTS.md`
- **Evaluations service** → `workspace/services/evaluations-service/AGENTS.md`
- **Users service** → `workspace/services/users-service/AGENTS.md`
- **API Gateway** → `workspace/gateways/api-gateway/AGENTS.md`
- **Infrastructure** → `workspace/infra/AGENTS.md`
- **Frontend App Layer** → `workspace/frontend/app/AGENTS.md`

## Rules for Agents

1. **Never edit `_generated` files** — find the generator or the user-owned counterpart.
2. **Frontend SDK is the source of truth** — all API calls go through `sdk/api/`. Never call services directly from UI components.
3. **Backend-first for new endpoints** — add route in handlers_register.go, then usecase, then repository, then gateway proxy.
4. **Test mocks must stay in sync** — when adding repository interface methods, update `evaluation_test.go` mock.
5. **Use `engram` for persistent memory** — save decisions, patterns, and gotchas after every session.
