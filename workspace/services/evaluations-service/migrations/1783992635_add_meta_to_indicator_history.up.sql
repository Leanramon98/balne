-- Migration: Add meta column to indicator_history for tracking goal changes

SET search_path TO evaluations_service;

ALTER TABLE indicator_history ADD COLUMN IF NOT EXISTS meta INTEGER;
