# AGENTS.md — Bookings Service

> Backend conventions for the bookings-service Go microservice.

## Architecture

Hexagonal architecture, same pattern as users-service:

```
internal/
├── domain/              ← Balneario, PlanUnit, Tariff, Customer, Reservation entities
├── ports/in/            ← BookingsUseCase driving port (http_handlers.go)
├── ports/out/           ← Repository driven port (repository.go)
├── usecases/            ← Business logic (Logic struct, conflict detection)
└── adapters/
    ├── in/http/         ← Echo HTTP handlers (public + internal routes)
    └── out/postgres/    ← PostgreSQL repository (database/sql + pgx stdlib)
```

## Key Responsibilities

- **Balnearios**: venue CRUD and lookup by slug
- **Plan Units**: rentable spots on a venue's plan map with position/shape
- **Tariffs**: pricing per unit type, period and season
- **Customers**: guest records and search
- **Reservations**: booking lifecycle with server-side overlap prevention
- **Availability**: rentable units with no active reservation over a date range

## Domain Entities

```go
type Balneario struct { ID, Name, Slug, Location string, CreatedAt, UpdatedAt }
type PlanUnit   struct { ID, BalnearioID, UnitNumber, Zone, Capacity, PositionX/Y, Width, Height, Shape, IsRentable, Status }
type Tariff     struct { ID, BalnearioID, UnitType, Period, Price, Currency, Season }
type Customer   struct { ID, Name, Email, Phone, CreatedAt, UpdatedAt }
type Reservation struct { ID, BalnearioID, UnitID, CustomerID, StartDate, EndDate, GuestCount, Status, TotalPrice, Notes, CreatedBy, CreatedAt, UpdatedAt }
```

`Reservation.ConflictsWith(other)` reports a half-open `[start, end)` overlap on
the same unit. The use case excludes cancelled reservations before comparing.

## Reservation Conflict Prevention

Two layers protect against double-booking the same unit:

1. **Server-side check** (`usecases.CreateReservation`): queries
   `GetReservationsByUnitAndDateRange` and rejects with `ErrReservationConflict`
   if any active (non-cancelled) reservation overlaps.
2. **DB backstop** (`migrations/001_create_tables.up.sql`): a partial
   `EXCLUDE USING gist` constraint on `(unit_id =, tstzrange &&)` filtered to
   `status <> 'cancelled'` catches races the application check misses.

The overlap test is half-open: `start_date < other.end_date AND other.start_date < end_date`.

## Endpoints

### Public (open; gateway may expose without auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/balnearios/:slug` | GET | Get balneario by slug |
| `/api/balnearios/:slug/units` | GET | Get plan units |
| `/api/balnearios/:slug/availability?start=&end=` | GET | Available units for date range |
| `/api/balnearios/:slug/reservations` | POST | Create public reservation |

### Internal (expect gateway JWT auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/balnearios` | GET | List balnearios |
| `/api/balnearios` | POST | Create balneario |
| `/api/balnearios/:id/plan` | GET | Full plan for a balneario |
| `/api/plan-units/:id` | PUT | Update a plan unit |
| `/api/reservations` | POST | Create reservation (internal) |
| `/api/reservations` | GET | List reservations (filters: `balneario_id`, `status`) |
| `/api/reservations/:id/status` | PUT | Update reservation status |
| `/api/customers` | POST | Create customer |
| `/api/customers` | GET | Search customers (`?q=`) |
| `/api/tariffs/:balnearioId` | GET | List tariffs |
| `/api/tariffs` | POST | Create tariff |

## Adding Auth to a New Endpoint

1. **Middleware is applied at gateway level** — no auth in bookings-service directly.
2. **JWT validation** happens in `api-gateway` via `AuthMiddleware`.
3. **Claims extraction** via `c.Get("user_id")`; `created_by` defaults to `public`/`internal`.

## File Rules

1. **User-owned files** have no `_generated` suffix and are maintained by developers.
2. **Never edit `*_generated.go`** anywhere in the workspace (e.g. the gateway) — use `core-cli sync`.
3. **IDs** are `uuid.UUID` everywhere; persistence uses UUID PKs.
4. **All SQL is parameterized** (`$1`, `$2`, …) — no string interpolation.
5. **Schema isolation** via `DB_URL` `search_path=bookings_service`.

## Database

- **Driver**: `github.com/jackc/pgx/v5/stdlib` registered as `"pgx"`, used through `database/sql`.
  (users-service uses `lib/pq`; bookings-service uses pgx v5's stdlib adapter while keeping the same `database/sql` + `DB_URL` pattern.)
- **DB_URL example**: `postgres://postgres:postgres@postgres:5432/postgres?sslmode=disable&search_path=bookings_service`
- **Migrations**: `migrations/001_create_tables.{up,down}.sql`, `migrations/002_seed_demo.up.sql`.
  Seed installs demo balneario `cocodrilo-pinamar` with 10 units, 2 tariffs, 1 customer.

## Testing

Table-driven tests, mock repository at the `portout.Repository` boundary
(same conventions as users-service / evaluations-service).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_URL` | PostgreSQL DSN with `search_path=bookings_service` |
| `PORT` | Listen port (default `8083`) |
