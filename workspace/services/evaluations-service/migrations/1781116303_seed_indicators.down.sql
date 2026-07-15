-- Rollback: Clear seeded indicators
SET search_path TO evaluations_service;

DELETE FROM indicator;
