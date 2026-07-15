-- Rollback: Clear seeded scopes
SET search_path TO evaluations_service;

DELETE FROM scope;
