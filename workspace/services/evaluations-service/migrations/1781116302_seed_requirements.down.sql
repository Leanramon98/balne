-- Rollback: Clear seeded requirements
SET search_path TO evaluations_service;

DELETE FROM requirement;
