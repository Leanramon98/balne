-- Rollback: bookings-service core schema (reverse dependency order)

DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS tariffs CASCADE;
DROP TABLE IF EXISTS plan_units CASCADE;
DROP TABLE IF EXISTS balnearios CASCADE;
