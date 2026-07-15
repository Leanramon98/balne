-- =============================================================================
-- Auto-Insight Migrations — 2026-07-13
-- Run against the evaluations_service schema in PostgreSQL.
-- =============================================================================

SET search_path TO evaluations_service;

-- Migration 1: add modified_by column to indicator_history
ALTER TABLE indicator_history ADD COLUMN IF NOT EXISTS modified_by VARCHAR(255) NOT NULL DEFAULT '';

-- Migration 2: add 'suma' to indicator_type ENUM (safe guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suma' AND enumtypid = 'indicator_type'::regtype) THEN
    ALTER TYPE indicator_type ADD VALUE 'suma';
  END IF;
END $$;

-- Convert the 20 indicators from numeric to suma
UPDATE indicator SET type = 'suma'
WHERE type = 'numeric'
  AND code IN (
    'GOB03_08_01', 'GOB03_08_02', 'GOB03_08_03',
    'GOB04_12_01',
    'TEC02_11_01', 'TEC03_13_02',
    'ACC02_10_01', 'ACC02_11_01',
    'ACC02_12_01', 'ACC02_12_02', 'ACC02_12_04', 'ACC02_12_05',
    'ACC02_13_01', 'ACC02_13_02', 'ACC02_13_03', 'ACC02_13_04',
    'ACC02_13_05', 'ACC02_13_06', 'ACC02_13_07', 'ACC02_13_08'
  );
