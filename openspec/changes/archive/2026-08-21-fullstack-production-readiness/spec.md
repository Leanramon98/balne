# Specification: Fullstack Production Readiness & Persistence Integration

## 1. Batch Plan Persistence Specification

### Requirements
- **Endpoint**: `PUT /api/bookings/balnearios/:id/plan`
- **Authentication**: Required (`AuthMiddleware` + admin role).
- **Request Body**:
  ```json
  {
    "units": [
      {
        "id": "uuid (optional for new units)",
        "unit_number": "101",
        "zone": "VIP",
        "capacity": 4,
        "position_x": 120.5,
        "position_y": 300.0,
        "width": 40.0,
        "height": 40.0,
        "shape": "rectangle",
        "is_rentable": true,
        "status": "available"
      }
    ]
  }
  ```
- **Behavior**:
  - Validates that `balneario_id` exists.
  - Replaces or syncs all plan units for the specified balneario within a single database transaction.
  - Units removed from the canvas in the request payload are deleted or marked non-rentable (preserving historical reservations if referenced).
  - Returns `200 OK` with the complete list of updated `BookingsPlanUnit` objects.

---

## 2. Dynamic Public Balneario Route Specification

### Requirements
- **Route**: `app/(public)/[slug]/page.tsx`
- **Behavior**:
  - Extracts `slug` parameter from URL path (e.g., `/cocodrilo-pinamar`, `/la-marea`).
  - Calls `getBalnearioBySlug(slug)` and `getPlanUnits(slug)` via BFF/API client.
  - If slug does not exist, renders a friendly 404 page.
  - Displays balneario header info (name, location), interactive canvas map rendered directly from DB unit positions/shapes, and unit filtering controls.
  - Allows public guests to select an `available` unit, enter customer details, and invoke `createPublicReservation(slug, input)`.
  - Upon successful submission, returns a reservation reference code and status `pending`.

---

## 3. Tenant Isolation & Security Specification

### Requirements
- **Gateway Level**:
  - `api-gateway` extracts `user_id` and `organization_id` (or `tenant_id`) from verified JWT claims.
  - Injects headers `X-User-ID` and `X-Tenant-ID` into forwarded requests to downstream microservices.
- **Service Level**:
  - `bookings-service` verifies that the requesting user's `X-Tenant-ID` has access to the target `balneario_id`.
  - Rejects unauthorized cross-tenant modifications with `403 Forbidden`.

---

## 4. Admin Reservation Dashboard Specification

### Requirements
- **Route**: `app/app/reservas/page.tsx`
- **Behavior**:
  - Fetches reservations via `listReservations({ balneario_id, status })` through BFF client.
  - Displays filter tabs: `Todas`, `Pendientes`, `Confirmadas`, `Canceladas`.
  - Provides inline actions to update reservation status:
    - `Confirmar` (`PUT /api/bookings/reservations/:id/status` -> `confirmed`)
    - `Cancelar` (`PUT /api/bookings/reservations/:id/status` -> `cancelled`)
    - `Check-out` (`PUT /api/bookings/reservations/:id/status` -> `checked_out`)
  - Integrates customer creation/lookup so admins can manually create internal bookings.
  - Reflects real-time unit status changes on the visual layout map.
