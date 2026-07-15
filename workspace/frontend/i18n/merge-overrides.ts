import type { TranslationOverride } from '@/sdk/api/translation-overrides-api';

/**
 * Merge base messages with active corrections.
 *
 * Correction wins per locale: for each active correction matching `locale`,
 * every occurrence of `source_text` inside string message values is replaced
 * with `corrected_text`.
 *
 * Legacy namespace/key records are still supported as a localStorage migration
 * bridge, but new records should use source/corrected text only.
 *
 * @param base - Base message map loaded from JSON (e.g. es.json or pt.json)
 * @param overrides - Array of translation overrides (typically from localStorage)
 * @param locale - Active locale to filter by
 * @returns Merged message map with overrides applied
 */
export function mergeMessages(
  base: Record<string, string>,
  overrides: TranslationOverride[],
  locale: string,
): Record<string, string> {
  const merged: Record<string, string> = { ...base };

  for (const override of overrides) {
    if (override.is_active === false) continue;
    if (override.locale !== locale) continue;

    if (override.source_text) {
      for (const [key, value] of Object.entries(merged)) {
        merged[key] = value.split(override.source_text).join(override.corrected_text);
      }
      continue;
    }

    const fullKey = [override.namespace, override.key].filter(Boolean).join('.');
    const legacyValue = override.corrected_text || override.override_value;
    if (fullKey && legacyValue) {
      merged[fullKey] = legacyValue;
    }
  }

  return merged;
}
