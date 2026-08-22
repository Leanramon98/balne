# Proposal: Fullstack Production Readiness & Persistence Integration

## Context & Motivation

Currently, the Balne platform has functional UI prototypes and Go backend services (`users-service`, `bookings-service`, `api-gateway`), but critical components rely on `localStorage` fallbacks or static routes instead of end-to-end database persistence:
- The visual plan editor (`/app/planos`) saves unit coordinates and configurations locally via `localStorage` (`draft-plan.ts`).
- Public booking pages are hardcoded per venue (`/la-marea`, `/cocodrilo-pinamar`) instead of consuming backend data dynamically by slug.
- `bookings-service` lacks a batch endpoint to persist full plan canvas layouts (`balnearios/:id/plan`).
- Admin reservation management lacks full lifecycle status transitions (`pending` → `confirmed` → `checked_out` / `cancelled`) linked to real customer records.
- API Gateway validates JWT tokens but does not yet enforce organization/tenant scoping (`X-Tenant-ID`).

To make the platform 100% production-ready for clients, we must eliminate all mock/draft fallbacks, enforce tenant security, and connect frontend and backend seamlessly with full PostgreSQL persistence.

## Proposed Changes

### 1. Backend (`bookings-service` & `api-gateway`)
- **Batch Plan Endpoint**: Implement `PUT /api/bookings/balnearios/:id/plan` in `bookings-service` and proxy it in `api-gateway` to replace, update, or sync plan units in a single transaction.
- **Tenant Scope Enforcement**: Update `api-gateway` auth middleware to extract tenant/organization claim from JWT and pass `X-Tenant-ID` header to downstream services. Validate tenant ownership of balnearios.
- **Reservation Lifecycle & Filters**: Enhance reservation queries to support date ranges, status filters, and customer details.

### 2. Frontend (`workspace/frontend`)
- **Dynamic Public Route**: Create `/app/(public)/[slug]/page.tsx` replacing hardcoded venue pages. Fetch balneario profile, plan layout, tariffs, and availability dynamically by slug.
- **Real-Time Plan Editor Persistence**: Connect `PlanEditor.tsx` directly to `bookings-api.ts` `savePlanLayout(balnearioId, units)`. Remove `draft-plan.ts` `localStorage` fallbacks in production mode.
- **Admin Reservation Dashboard**: Upgrade `/app/app/reservas` to display pending, confirmed, and cancelled reservations with customer lookup, status change actions, and operational notes.
- **SDK & Error Handling**: Standardize API client calls, loading states, and user feedback across all modules.

### 3. Database (`bookings_service` schema)
- Ensure indexes and constraints on `plan_units` and `reservations` support efficient batch updates and overlap checking.
- Provide clean seed data script for initial balneario profiles and default plans.

## User Impact & Deliverables
- **Clients (Balneario Owners)**: Can design their beach layout graphically, save it permanently to the database, and manage real-time reservations without data loss.
- **End Users (Bathers)**: Can browse any balneario by URL slug, select available units on the live interactive plan, and place reservations.
- **System**: Fully integrated hexagonal Go backend, Echo API Gateway, Next.js 15 frontend, and PostgreSQL DB with zero mock data.

## Verification Plan
1. **API Integration Tests**: Verify batch plan update (`PUT /api/bookings/balnearios/:id/plan`) and conflict detection in `bookings-service`.
2. **End-to-End Walkthrough**:
   - Log in as admin → open `/app/planos` → modify canvas layout → save → verify PostgreSQL DB updated.
   - Open public page `/[slug]` → view updated layout and available units → place reservation.
   - Check admin dashboard `/app/app/reservas` → view new `pending` reservation → confirm status change to `confirmed`.
