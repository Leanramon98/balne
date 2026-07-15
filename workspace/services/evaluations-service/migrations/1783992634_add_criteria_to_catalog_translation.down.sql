-- Migration: Remove criteria column from catalog_translation

SET search_path TO evaluations_service;

ALTER TABLE catalog_translation DROP COLUMN IF EXISTS criteria;
