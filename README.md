# Project Base Template

A clean, modern, and neutral full-stack monorepo template built with Next.js and Go.

## Architecture

This template provides a robust foundation for building scalable applications:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui.
- **API Gateway**: A lightweight API Gateway written in Go (Echo v4) to handle JWT validation, CORS, and reverse proxying to backend microservices.
- **Microservices**: A generic `users-service` providing authentication, RBAC, and user management out of the box using Hexagonal Architecture.
- **Database**: PostgreSQL 16 using a schema-per-service isolation strategy (`search_path`).
- **Messaging**: RabbitMQ ready for asynchronous event-driven communication.

## Quick Start

1. Start the infrastructure using Docker Compose:
   ```bash
   cd workspace/infra
   docker-compose up -d
   ```

2. Start the frontend development server:
   ```bash
   cd workspace/frontend
   npm install
   npm run dev
   ```

3. The API Gateway runs on `:8080`, Users Service on `:8081`, and the frontend on `:3000`.

## Directory Structure

```
project-base/
├── workspace/
│   ├── frontend/         # Next.js Application
│   ├── services/         # Go Microservices
│   │   └── users-service # Ready-to-use Auth & RBAC service
│   ├── gateways/         # API Gateways
│   │   └── api-gateway   # Central entry point and JWT validation
│   └── infra/            # Docker compose and DB init scripts
```

## Documentation

- Check `AGENTS.md` for AI agent conventions.
- Check `workspace/frontend/AGENTS.md` for frontend-specific rules.
