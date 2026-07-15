-- Rollback: Drop evaluations_service schema and all types

SET search_path TO evaluations_service;

DROP TABLE IF EXISTS subnational_level CASCADE;
DROP TABLE IF EXISTS destination_typology CASCADE;
DROP TABLE IF EXISTS population_range CASCADE;
DROP TABLE IF EXISTS region CASCADE;
DROP TABLE IF EXISTS member_type CASCADE;
DROP TABLE IF EXISTS responsible_area CASCADE;

DROP TYPE IF EXISTS dti_plan_status CASCADE;
DROP TYPE IF EXISTS gp_status CASCADE;
DROP TYPE IF EXISTS evidence_type CASCADE;
DROP TYPE IF EXISTS action_status CASCADE;
DROP TYPE IF EXISTS indicator_type CASCADE;
DROP TYPE IF EXISTS access_level CASCADE;
DROP TYPE IF EXISTS evaluation_status CASCADE;
DROP TYPE IF EXISTS evaluation_type CASCADE;

-- Optionally drop the schema (commented out for safety)
-- DROP SCHEMA IF EXISTS evaluations_service CASCADE;
