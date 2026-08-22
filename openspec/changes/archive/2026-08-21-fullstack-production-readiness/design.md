# Architecture & Design: Fullstack Production Readiness

## Architecture Diagram

```
Browser Client (Next.js App)
    │
    ├── Public Guest ───> GET/POST /[slug] ──────┐
    │                                            │
    └── Admin User ────> /app/planos, /reservas ──┤
                                                 │
                                                 ▼
                                     Next.js BFF Proxy (/api/*)
                                                 │
                                                 │ Forward JWT & Headers
                                                 ▼
                                     Echo API Gateway (8080)
                                                 │
                                  ┌──────────────┴──────────────┐
                                  │ JWT Auth & Tenant Scoping    │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                    bookings-service (Go 8083)
                                  ┌─────────────────────────────┐
                                  │ Hexagonal Architecture      │
                                  │ Domain, Ports, Adapters, DB │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                    PostgreSQL 16 (bookings_service)
```

## Data Model & Sync Strategy

### 1. Plan Units Transactional Batch Sync
- In `bookings-service`, implement `SavePlan(ctx context.Context, balnearioID uuid.UUID, units []*domain.PlanUnit) error`.
- Execution inside SQL transaction (`tx`):
  1. Fetch existing unit IDs for `balnearioID`.
  2. For units in request: upsert (insert new with generated UUID, update existing coordinates, zone, capacity, shape, status).
  3. For existing units missing from request: soft-delete or flag `is_rentable = false` if referenced in `reservations` table, otherwise delete.
  4. Commit transaction.

### 2. Frontend Layout State & Save Strategy
- `PlanEditor.tsx` keeps in-memory state of layout elements.
- When user clicks "Guardar Cambios", trigger `saveBalnearioPlan(balnearioId, units)` in `sdk/api/bookings-api.ts`.
- Remove reliance on `localStorage` draft key except as offline crash recovery option.

### 3. Dynamic Public Route Setup
- Move static page code into reusable `PublicBalnearioView` component.
- Route `app/(public)/[slug]/page.tsx` renders `PublicBalnearioView` with server-side or client-side fetched data for the current slug.
