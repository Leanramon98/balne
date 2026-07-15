# AGENTS.md — Infrastructure

> Docker Compose and deployment conventions.

## Services

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| PostgreSQL | `infra-postgres-1` | 5432 | Main database |
| RabbitMQ | `infra-rabbitmq-1` | 5672, 15672 | Message broker |
| API Gateway | `infra-api-gateway-1` | 8080 | Reverse proxy + JWT |
| Evaluations Service | `infra-evaluations-service-1` | 8082 | Core business logic |
| Users Service | `infra-users-service-1` | 8081 | Auth + RBAC |

## Docker Compose

File: `docker-compose.yml`

Key conventions:
- **Service names** use prefix `infra-` (e.g., `infra-evaluations-service`)
- **Networks**: All services share default network
- **Volumes**: PostgreSQL data persisted in named volume
- **Health checks**: PostgreSQL has healthcheck for dependency ordering

## Environment Variables

Set in `.env` (not committed):

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
```

Frontend `.env` (`workspace/frontend/.env`):
```
INTERNAL_GATEWAY_URL=http://api-gateway:8080   # Server-side only
```

## Rebuilding Services

After code changes:

```bash
cd workspace/infra

# Build specific service
docker compose build evaluations-service
docker compose build api-gateway
docker compose build users-service

# Recreate and restart
docker compose up -d evaluations-service
```

## Database Operations

### Running SQL Scripts

```bash
# Copy SQL file to container
docker cp seed.sql infra-postgres-1:/tmp/seed.sql

# Execute via psql (inside container)
docker exec -i infra-postgres-1 psql -U postgres -d postgres -f /tmp/seed.sql
```

### Connecting to PostgreSQL

```bash
docker exec -it infra-postgres-1 psql -U postgres -d postgres
```

## Logs

```bash
# Service logs
docker compose logs evaluations-service --tail=50

# All logs
docker compose logs -f
```

## Makefile Commands

Common operations (from `workspace/Makefile`):

```bash
make build    # Build all services
make up       # Start all services
make down     # Stop all services
make logs     # View logs
make test     # Run tests
```

## Port Mapping

| Port | Service |
|------|---------|
| 5432 | PostgreSQL |
| 5672 | RabbitMQ AMQP |
| 15672 | RabbitMQ Management UI |
| 8080 | API Gateway |
| 8081 | Users Service |
| 8082 | Evaluations Service |

## Rules

1. **Always use `docker compose`** (not `docker-compose` standalone)
2. **Container names use `infra-` prefix** — remember this when running commands
3. **Never commit `.env` files** — they contain secrets
4. **Rebuild after backend changes** — containers don't auto-reload
5. **Use health checks** before dependent services start
