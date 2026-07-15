-- Migration: Create action_translation table for dynamic content i18n

SET search_path TO evaluations_service;

CREATE TABLE action_translation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  ods JSONB DEFAULT '[]',
  translated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  translation_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  UNIQUE (action_id, locale)
);

CREATE INDEX idx_action_translation_action ON action_translation(action_id);
CREATE INDEX idx_action_translation_locale_reviewed ON action_translation(locale, translation_reviewed);
