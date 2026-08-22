# Implementation Tasks: Fullstack Production Readiness

## Task Breakdown

### Phase 1: Backend Plan Batch Sync & Service Enhancement (`bookings-service`)
- [x] **Task 1.1**: Add `SavePlan` method to `portin.BookingsUseCase` and implement transactional upsert/sync in `internal/usecases/logic.go` and `internal/adapters/out/postgres/repository.go`.
- [x] **Task 1.2**: Add `PUT /balnearios/:id/plan` HTTP handler in `internal/adapters/in/http/handlers.go`.
- [x] **Task 1.3**: Update `api-gateway/routes_bookings.go` to proxy `PUT /api/bookings/balnearios/:id/plan` to `bookings-service`.

### Phase 2: Dynamic Public Route & Clean Public Booking Flow
- [x] **Task 2.1**: Implement dynamic route `app/(public)/[slug]/page.tsx` in `frontend`.
- [x] **Task 2.2**: Connect public booking flow directly to `sdk/api/bookings-api.ts`.
- [x] **Task 2.3**: Persist public guest bookings as `pending` reservations in `bookings_service.reservations`.

### Phase 3: Plan Editor Frontend Persistence (`/app/planos`)
- [x] **Task 3.1**: Update `sdk/api/bookings-api.ts` to add `saveBalnearioPlan(balnearioId, units)`.
- [x] **Task 3.2**: Connect `PlanEditor.tsx` save button to `saveBalnearioPlan`, persisting unit geometry directly to PostgreSQL.
- [x] **Task 3.3**: Sync layout changes seamlessly between canvas state and database.

### Phase 4: Admin Reservation Dashboard & Status Management (`/app/reservas`)
- [x] **Task 4.1**: Upgrade `/app/app/reservas/page.tsx` to integrate live API calls from `bookings-api.ts`.
- [x] **Task 4.2**: Support status transitions (`confirmed`, `cancelled`, `checked_out`) using `updateReservationStatus`.
- [x] **Task 4.3**: Connect customer creation and booking confirmation to backend services.

### Phase 5: Tenant Isolation & Verification
- [x] **Task 5.1**: Pass `X-Tenant-ID` claim header from `api-gateway` middleware (`middleware.go`) to microservices.
- [x] **Task 5.2**: Perform end-to-end verification build check (`go build` and `npx tsc --noEmit`) with clean zero-error validation.
