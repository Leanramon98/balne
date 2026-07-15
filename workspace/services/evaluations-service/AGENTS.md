# AGENTS.md — Evaluations Service

> Backend conventions for the evaluations-service Go microservice.

## Architecture

Hexagonal architecture (Ports & Adapters):

```
internal/
├── domain/              ← Domain entities (Action, Evaluation, Indicator, etc.)
├── ports/in/            ← Driving port interfaces (HTTP handlers, gRPC)
├── ports/out/           ← Driven port interfaces (Repository, EventPublisher)
├── usecases/            ← Business logic (Logic struct)
├── adapters/
│   ├── in/http/         ← HTTP handlers + Echo registration
│   └── out/postgres/    ← PostgreSQL repository implementation
├── grpc/                ← gRPC server (generated)
└── adapters/out/messaging/ ← RabbitMQ event publisher (generated)
```

## Adding a New Endpoint

Follow this order:

1. **Repository interface** (`ports/out/repository_interface.go`)
   ```go
   CreateNewEntity(ctx context.Context, e *domain.NewEntity) error
   FindNewEntityByID(ctx context.Context, id uuid.UUID) (*domain.NewEntity, error)
   ```

2. **Repository implementation** (`adapters/out/postgres/repository.go`)
   - Use `evaluations_service.` schema prefix
   - Use `uuid.UUID` for IDs
   - Scan with `rows.Scan()` — match column order exactly
   - Return `sql.ErrNoRows` for not found

3. **Usecase handler** (`usecases/logic_*.go`)
   ```go
   func (l *Logic) HandleNewOperation(c echo.Context) error {
       // Parse params
       // Validate input
       // Call repository
       // Return appropriate status
   }
   ```

4. **Route registration** (`adapters/in/http/handlers_register.go`)
   ```go
   e.GET("/new-entities", uc.HandleListNewEntities)
   e.POST("/new-entities", uc.HandleCreateNewEntity)
   e.GET("/new-entities/:id", uc.HandleGetNewEntity)
   e.PUT("/new-entities/:id", uc.HandleUpdateNewEntity)
   e.DELETE("/new-entities/:id", uc.HandleDeleteNewEntity)
   ```

5. **Gateway proxy route** (`../../gateways/api-gateway/routes_evaluations.go`)
   ```go
   auth("GET", "/new-entities")
   auth("POST", "/new-entities")
   auth("GET", "/new-entities/:id")
   auth("PUT", "/new-entities/:id")
   auth("DELETE", "/new-entities/:id")
   ```

6. **Update test mock** (`usecases/evaluation_test.go`)
   - Add mock methods to `mockRepo` struct
   - Ensure interface compliance

## Domain Entities

Key entities in `domain/entities.go`:

| Entity | Description |
|--------|-------------|
| `Destination` | City/region with lat/lng, country, population |
| `Evaluation` | Assessment cycle (borrador/en_evaluacion/finalizada) |
| `Scope` | Assessment domain (GOB, INN, TEC, SOST, ACC) |
| `Requirement` | Requirement within a scope |
| `Indicator` | Measurable metric (gradient/boolean/numeric) |
| `Action` | Improvement action in transformation plan |
| `ActionIndicatorLink` | Many-to-many between actions and indicators |
| `ActionEvidence` | Evidence file/link attached to action |
| `GoodPractice` | Publicly showcaseable completed action |
| `DtiPlan` | Plan de Transformación |
| `MemberType` | Type of DTI member |
| `SubnationalLevel` | Administrative level (province, department, etc.) |
| `PopulationRange` | Population bracket |
| `Region` | Geographic region |
| `ResponsibleArea` | Responsible department/area |
| `AxisLevel` | Axis categorization (same as scope) |

## Database Conventions

- **Schema**: `evaluations_service` (set via `search_path`)
- **Tables**: Plural, snake_case (e.g., `action_indicator_link`)
- **Columns**: snake_case (e.g., `created_at`, `destination_id`)
- **JSONB fields**: Use `json.RawMessage` in Go, `jsonb` in PostgreSQL
- **UUIDs**: All primary keys are UUID
- **Timestamps**: `created_at` and `updated_at` with `NOW()` default

## HTTP Status Codes

| Scenario | Status |
|----------|--------|
| Success (GET) | 200 |
| Created (POST) | 201 |
| Updated (PUT) | 200 |
| Deleted (DELETE) | 204 (No Content) |
| Not found | 404 |
| Validation error | 422 |
| Unauthorized | 401 |
| Forbidden | 403 |
| Server error | 500 |

## File Rules

1. **Never edit `*_generated.go`** — use `core-cli sync` or code generators
2. **User-owned files** have no suffix (e.g., `logic.go`, `repository.go`)
3. **Always add mock methods** to `evaluation_test.go` when changing repository interface
4. **Use `uuid.New()` for new IDs**
5. **Return `sql.ErrNoRows`** for not-found from repository
6. **Parse UUIDs with `uuid.Parse()`** — return 400 for invalid format

## Testing

- **Unit tests**: `*_test.go` next to source files
- **Mock repository**: `evaluation_test.go` has `mockRepo` struct
- **Test naming**: `TestHandle{Operation}_{Scenario}`
- Use `t.Run()` for subtests

## Domain Knowledge

### DTI Assessment Flow

```
Destino → Evaluación (borrador) → Auto-evaluación → Evaluación → Re-evaluación
     ↓                              ↓                    ↓              ↓
   Ámbitos/GOB                    Indicadores          Acciones    Buenas Prácticas
```

### Evaluation States
- `borrador` — Draft, editable
- `en_evaluacion` — Under evaluation
- `finalizada` — Completed, read-only

### Access Levels
- `administracion` — Full admin access
- `evaluador` — Evaluator (can evaluate indicators)
- `observador` — Observer (read-only)

### Indicator Types
- `gradient` — 0%, 25%, 50%, 75%, 100%
- `boolean` — Yes/No
- `numeric` — Numeric value
