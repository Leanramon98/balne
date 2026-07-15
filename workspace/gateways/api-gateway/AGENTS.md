# AGENTS.md — API Gateway

> Conventions for the Go Echo API Gateway.

## Purpose

The API Gateway is the single entry point for all client requests:
- **JWT validation** — verifies token signature and expiry
- **Route proxying** — forwards to appropriate microservice
- **Auth middleware** — injects user context into requests

## Architecture

```
main.go                    ← Entry point
main_generated.go          ← Generated route setup (from schema.yaml)
routes_evaluations.go      ← Custom evaluation proxy routes (user-owned)
main.go (api-gateway)      ← Echo setup, middleware chain
```

## Adding a New Route

When a new endpoint is added to a backend service, it must also be registered here:

1. **Open `routes_evaluations.go`** (or create similar for other services)
2. **Add the route**:
   ```go
   auth("GET", "/new-endpoint")
   auth("POST", "/new-endpoint")
   auth("GET", "/new-endpoint/:id")
   auth("PUT", "/new-endpoint/:id")
   auth("DELETE", "/new-endpoint/:id")
   ```
3. **The `auth()` helper** registers with JWT middleware:
   ```go
   func auth(method, path string) {
       e.Add(method, "/api/evaluations"+path, proxyHandler(...), AuthMiddleware)
   }
   ```

## Proxy Pattern

The gateway proxies requests:
- `/api/evaluations/*` → evaluations-service (port 8082)
- `/api/users/*` → users-service (port 8081)

Proxy implementation in `main_generated.go`:
```go
func proxyHandler(serviceName string, port int, prefix string, targetPrefix string) echo.HandlerFunc {
    // Creates reverse proxy to upstream service
    // Strips/replaces path prefixes as needed
}
```

## JWT Middleware

The `AuthMiddleware`:
1. Extracts `Authorization: Bearer <token>` header
2. Validates JWT signature with `JWTSecret`
3. Sets `user_id` and `roles` in Echo context
4. Returns 401 for missing/invalid tokens

Public routes (no auth):
- `/api/evaluations/public/*`
- `/api/evaluations/health`
- Auth endpoints themselves

## File Rules

1. **Never edit `main_generated.go`** — use `core-cli sync`
2. **Custom routes go in `routes_evaluations.go`** — user-owned file
3. **Always use `auth()` helper** for protected routes
4. **Port mapping**: evaluations-service = 8082, users-service = 8081

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | HMAC secret for JWT validation |
| `EVALUATIONS_SERVICE_URL` | evaluations-service host:port |
| `USERS_SERVICE_URL` | users-service host:port |

## Testing

Run gateway locally:
```bash
cd workspace/infra
docker compose up api-gateway
```

Test proxy:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/evaluations/destinations
```
