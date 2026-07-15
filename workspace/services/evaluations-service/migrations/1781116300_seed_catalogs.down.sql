-- Rollback: Clear seeded catalog data

SET search_path TO evaluations_service;

DELETE FROM subnational_level;
DELETE FROM region;
DELETE FROM population_range;
DELETE FROM destination_typology;
DELETE FROM member_type;
DELETE FROM axis_level;
