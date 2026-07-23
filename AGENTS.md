# AGENTS.md — Project Template

> Global entry point for any AI agent working on this codebase. Read this first, then dive into the relevant sub-AGENTS.md.

## Project Overview

**Project Template** is a clean, neutral starter kit for new web applications. It provides a full-stack foundation with Next.js, Go microservices, API Gateway, and PostgreSQL.

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
project-base/
├── AGENTS.md                    ← You are here
├── workspace/
│   ├── frontend/               ← Next.js app (see frontend/AGENTS.md)
│   │   ├── app/(admin)/        ← Admin pages (AppShell)
│   │   ├── app/(public)/       ← Public pages (no auth)
│   │   ├── components/         ← Atomic Design hierarchy
│   │   ├── sdk/                ← API clients, auth context, hooks
│   │   └── lib/                ← Utilities
│   ├── services/
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
                                        → users-service (port 8081)
```

## Navigation

- **Frontend conventions** → `workspace/frontend/AGENTS.md`
- **Users service** → `workspace/services/users-service/AGENTS.md`
- **API Gateway** → `workspace/gateways/api-gateway/AGENTS.md`
- **Infrastructure** → `workspace/infra/AGENTS.md`
- **Frontend App Layer** → `workspace/frontend/app/AGENTS.md`

## Rules for Agents

1. **Never edit `_generated` files** — find the generator or the user-owned counterpart.
2. **Frontend SDK is the source of truth** — all API calls go through `sdk/api/`. Never call services directly from UI components.
3. **Backend-first for new endpoints** — add route in handlers_register.go, then usecase, then repository, then gateway proxy.
4. **Use `engram` for persistent memory** — save decisions, patterns, and gotchas after every session.
