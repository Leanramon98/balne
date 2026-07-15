-- Migration: Remove meta column from indicator_history

SET search_path TO evaluations_service;

ALTER TABLE indicator_history DROP COLUMN IF EXISTS meta;
