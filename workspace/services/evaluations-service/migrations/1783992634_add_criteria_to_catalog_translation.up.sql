-- Migration: Add criteria column to catalog_translation for indicator criteria i18n

SET search_path TO evaluations_service;

ALTER TABLE catalog_translation ADD COLUMN IF NOT EXISTS criteria TEXT;
