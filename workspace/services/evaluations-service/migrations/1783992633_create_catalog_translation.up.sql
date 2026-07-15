-- Migration: Create catalog_translation table for catalog entity i18n
-- (scopes, requirements, indicators, member types, etc.)

SET search_path TO evaluations_service;

CREATE TABLE catalog_translation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  locale VARCHAR(5) NOT NULL,
  name TEXT,
  description TEXT,
  translated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  translation_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  UNIQUE (entity_type, entity_id, locale)
);

CREATE INDEX idx_catalog_translation_entity ON catalog_translation(entity_type, entity_id);
CREATE INDEX idx_catalog_translation_locale_reviewed ON catalog_translation(locale, translation_reviewed);
