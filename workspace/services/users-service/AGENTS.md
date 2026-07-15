# AGENTS.md — Users Service

> Backend conventions for the users-service Go microservice.

## Architecture

Hexagonal architecture, same pattern as evaluations-service:

```
internal/
├── domain/              ← User, Role, AuditLog, UserProfile entities
├── ports/in/            ← HTTP handlers, gRPC
├── ports/out/           ← Repository, EventPublisher, EmailService
├── usecases/            ← Business logic (Logic struct)
└── adapters/
    ├── in/http/         ← HTTP handlers + JWT middleware
    └── out/postgres/    ← PostgreSQL repository
```

## Key Responsibilities

- **Authentication**: JWT token generation and validation
- **RBAC**: Role-based access control (roles and permissions)
- **User Management**: CRUD for users, profiles, password reset
- **Audit Logging**: Tracks all user actions
- **Email**: Password reset emails (currently log-only in dev)

## JWT Token Structure

The token includes extended claims:

```go
type ExtendedClaims struct {
    UserID        string           `json:"user_id"`
    Email         string           `json:"email"`
    FullName      string           `json:"full_name"`
    Role          string           `json:"role"`
    DestinationID *string          `json:"destination_id,omitempty"`
    Permissions   PermissionClaims `json:"permissions"`
    jwt.RegisteredClaims
}
```

### Permission Claims

```go
type PermissionClaims struct {
    AccessScope             string   `json:"access_scope"`
    CanWriteValues          bool     `json:"can_write_values"`
    CanManageUsers          bool     `json:"can_manage_users"`
    CanApproveGoodPractices bool     `json:"can_approve_good_practices"`
    EvaluationTypes         []string `json:"evaluation_types"`
}
```

## Adding Auth to a New Endpoint

1. **Middleware** is applied at gateway level — no auth in users-service directly
2. **JWT validation** happens in `api-gateway` via `AuthMiddleware`
3. **Claims extraction** via `c.Get("user_id")` and `c.Get("roles")`

## User Entity

```go
type User struct {
    ID            uuid.UUID
    Email         string
    FullName      string
    PasswordHash  string
    RoleID        uuid.UUID
    DestinationID *uuid.UUID
    IsActive      bool
    CreatedAt     time.Time
    UpdatedAt     time.Time
}
```

## Roles

| Role | Description |
|------|-------------|
| `admin` | Global administrator |
| `admin_destino` | Destination admin |
| `gestor_destino` | Destination manager |
| `consultor` | Consultant |
| `auditor` | Auditor |
| `gestor_regional` | Regional manager |
| `gestor_nacional` | National manager |

## File Rules

1. **Never edit `*_generated.go`** — use `core-cli sync`
2. **User-owned files** have no suffix
3. **JWT Secret**: `JWTSecret` in `jwt_middleware.go` (loaded from env in production)
4. **Password hashing**: bcrypt with default cost
5. **Always check `IsActive`** before allowing login

## Testing

Same conventions as evaluations-service. Mock repository in test files.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/auth/login` | POST | Authenticate, return JWT |
| `/api/users/auth/register` | POST | Create new user |
| `/api/users/auth/forgot-password` | POST | Send reset email |
| `/api/users/auth/reset-password` | POST | Reset with token |
| `/api/users/users` | GET/POST | List/Create users |
| `/api/users/users/:id` | GET/PUT/DELETE | User CRUD |
| `/api/users/users/:id/restore-password` | POST | Admin reset password |
| `/api/users/roles` | GET | List roles |
| `/api/users/audit-logs` | GET | Audit trail |
| `/api/users/me` | GET | Current user profile |

## Events

Published to RabbitMQ:
- `UserCreated`
- `UserUpdated`
- `UserDeleted`
- `PasswordResetRequested`
