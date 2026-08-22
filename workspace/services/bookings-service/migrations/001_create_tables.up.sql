-- Migration: bookings-service core schema
-- Schema is selected via DB_URL search_path=bookings_service.
-- All ids are UUID; timestamps are timestamptz; prices numeric.

CREATE SCHEMA IF NOT EXISTS bookings_service;
SET search_path TO bookings_service, public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- needed for EXCLUDE on uuid = and tstzrange &&

-- ---------------------------------------------------------------------------
-- balnearios: the venue aggregate root
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS balnearios (
    id         UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    location   TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- plan_units: rentable spots on a balneario's plan map
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_units (
    id           UUID PRIMARY KEY,
    balneario_id UUID NOT NULL REFERENCES balnearios(id) ON DELETE CASCADE,
    unit_number  TEXT NOT NULL,
    zone         TEXT NOT NULL DEFAULT '',
    capacity     INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
    position_x   DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y   DOUBLE PRECISION NOT NULL DEFAULT 0,
    width        DOUBLE PRECISION NOT NULL DEFAULT 0,
    height       DOUBLE PRECISION NOT NULL DEFAULT 0,
    shape        TEXT NOT NULL DEFAULT 'rectangle' CHECK (shape IN ('rectangle', 'circle')),
    is_rentable  BOOLEAN NOT NULL DEFAULT TRUE,
    status       TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'held', 'maintenance'))
);

CREATE INDEX IF NOT EXISTS idx_plan_units_balneario_id ON plan_units(balneario_id);

-- ---------------------------------------------------------------------------
-- tariffs: price for a unit type over a period during a season
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tariffs (
    id           UUID PRIMARY KEY,
    balneario_id UUID NOT NULL REFERENCES balnearios(id) ON DELETE CASCADE,
    unit_type    TEXT NOT NULL,
    period       TEXT NOT NULL CHECK (period IN ('day', 'week', 'fortnight', 'season')),
    price        NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    currency     TEXT NOT NULL DEFAULT 'ARS',
    season       TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tariffs_balneario_id ON tariffs(balneario_id);

-- ---------------------------------------------------------------------------
-- customers: guests who place reservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id         UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    phone      TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ---------------------------------------------------------------------------
-- reservations: a booking of a unit by a customer over [start_date, end_date)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id           UUID PRIMARY KEY,
    balneario_id UUID NOT NULL REFERENCES balnearios(id) ON DELETE CASCADE,
    unit_id      UUID NOT NULL REFERENCES plan_units(id) ON DELETE CASCADE,
    customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    start_date   TIMESTAMPTZ NOT NULL,
    end_date     TIMESTAMPTZ NOT NULL,
    guest_count  INTEGER NOT NULL DEFAULT 1 CHECK (guest_count >= 1),
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'checked_out')),
    total_price  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    notes        TEXT NOT NULL DEFAULT '',
    created_by   TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date)
);

-- Composite indexes for overlap queries.
CREATE INDEX IF NOT EXISTS idx_reservations_balneario_dates
    ON reservations(balneario_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_unit_dates
    ON reservations(unit_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_customer
    ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status
    ON reservations(status);

-- Prevent two active (non-cancelled) reservations from overlapping on the
-- same unit. This is the DB-level backstop for the server-side conflict check
-- performed in the use case; it catches races the application check misses.
ALTER TABLE reservations
    ADD CONSTRAINT reservations_no_overlap
    EXCLUDE USING gist (
        unit_id WITH =,
        tstzrange(start_date, end_date, '[)') WITH &&
    ) WHERE (status <> 'cancelled');
