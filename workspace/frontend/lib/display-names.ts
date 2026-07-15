/**
 * Shared utility for resolving human-readable display names from raw IDs.
 * Fallback chain: _name → first 8 chars of ID → '-'
 *
 * Locale-aware getters delegate to i18n messages via createDisplayNames().
 * Backward-compat consts (AXIS_LABELS, ACTION_STATUS_OPTIONS, GRADIENT_LABELS)
 * are derived from messages with default locale 'es' for non-migrated callers.
 */

import { createDisplayNames } from '@/i18n/display-names';
import type { DisplayNamesAPI } from '@/i18n/display-names';

// ──────────────────────────────────────────
// Generic utility
// ──────────────────────────────────────────

export function displayName<T extends Record<string, any>>(
  obj: T,
  idField: keyof T,
  nameField: keyof T,
): string {
  return obj[nameField] ?? obj[idField]?.slice(0, 8) ?? '-';
}

// ──────────────────────────────────────────
// Factory helper
// ──────────────────────────────────────────

function create(locale?: string): DisplayNamesAPI {
  return createDisplayNames(locale);
}

// ──────────────────────────────────────────
// Axis labels
// ──────────────────────────────────────────

export function getAxisLabel(code: string, locale?: string): string {
  return create(locale).getAxisLabel(code);
}

export function getAxisOptions(locale?: string): { value: string; label: string }[] {
  return create(locale).getAxisOptions();
}

/**
 * Backward-compat const — always resolved with default locale 'es'.
 * @deprecated Use getAxisLabel(code, locale?) or getAxisOptions(locale?) instead.
 */
export const AXIS_LABELS: Record<string, string> = {
  gob: getAxisLabel('gob'),
  inn: getAxisLabel('inn'),
  tec: getAxisLabel('tec'),
  sost: getAxisLabel('sost'),
  acc: getAxisLabel('acc'),
};

// ──────────────────────────────────────────
// Action status labels
// ──────────────────────────────────────────

export function getActionStatusLabel(status: string, locale?: string): string {
  return create(locale).getActionStatusLabel(status);
}

export function getActionStatusOptions(locale?: string): { value: string; label: string }[] {
  const api = create(locale);
  const statuses: string[] = ['idea', 'en_planificacion', 'en_ejecucion', 'finalizada', 'descartada'];
  return statuses.map((s) => ({ value: s, label: api.getActionStatusLabel(s) }));
}

/**
 * Backward-compat const — always resolved with default locale 'es'.
 * @deprecated Use getActionStatusLabel(status, locale?) or getActionStatusOptions(locale?) instead.
 */
export const ACTION_STATUS_OPTIONS = getActionStatusOptions();

// ──────────────────────────────────────────
// Evidence type icons and labels
// ──────────────────────────────────────────

export const EVIDENCE_TYPE_ICONS: Record<string, string> = {
  document: 'document',
  url: 'url',
  audiovisual: 'audiovisual',
  press: 'press',
};

export function getEvidenceTypeLabel(type: string, locale?: string): string {
  return create(locale).getEvidenceTypeLabel(type);
}

// ──────────────────────────────────────────
// Gradient display constants
// ──────────────────────────────────────────

/**
 * Percentage-only labels (backward compat for non-migrated callers).
 * Locale-aware callers should use getGradientLabel(level, locale?).
 */
export const GRADIENT_LABELS = ['0%', '25%', '50%', '75%', '100%'];

export const GRADIENT_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
];

export function getGradientLabel(level: number | string, locale?: string): string {
  return create(locale).getGradientLabel(level);
}

// ──────────────────────────────────────────
// Role labels
// ──────────────────────────────────────────

export function getRoleLabel(roleId: string | null | undefined, locale?: string): string {
  return create(locale ?? 'es').getRoleLabel(roleId);
}
