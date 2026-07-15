/**
 * Locale-aware date formatting utilities.
 *
 * Preferred: useIntl / useFormatter from next-intl for React components.
 * Fallback: toLocaleDateString with mapped locale codes.
 */

/**
 * Map short locale codes (es, pt) to Intl locale identifiers.
 */
const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  pt: 'pt-PT',
};

/**
 * Format a date using Intl.DateTimeFormat with the given locale.
 * Falls back to 'es-ES' when the locale is not mapped.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  locale: string = 'es',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (date == null) return '-';
  const d = date instanceof Date ? date : new Date(date);
  const localeStr = LOCALE_MAP[locale] || 'es-ES';
  return d.toLocaleDateString(localeStr, options);
}

/**
 * Format a date+time using Intl.DateTimeFormat with the given locale.
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  locale: string = 'es',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (date == null) return '-';
  const d = date instanceof Date ? date : new Date(date);
  const localeStr = LOCALE_MAP[locale] || 'es-ES';
  return d.toLocaleString(localeStr, options);
}

/**
 * Dynamically import the date-fns locale for the given short locale code.
 * Falls back to 'es' if the locale module is not found.
 *
 * Usage:
 *   const locale = await withDateFormatLocale('pt');
 *   formatDistance(date1, date2, { locale });
 */
import type { Locale } from 'date-fns';
import { es, pt } from 'date-fns/locale';

const DATE_FNS_LOCALES: Record<string, Locale> = { es, pt };

/** date-fns locale modules must be statically imported so Next.js can bundle them. */
function loadLocale(code: string): Locale {
  return DATE_FNS_LOCALES[code] || es;
}

/**
 * Convert a date string (ISO, RFC3339) to YYYY-MM-DD format for `<input type="date">`.
 * Returns empty string for null/undefined/invalid dates.
 */
export function toDateInputValue(date: string | null | undefined): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export async function withDateFormatLocale(
  locale: string = 'es',
): Promise<Locale> {
  const localeMap: Record<string, string> = { es: 'es', pt: 'pt' };
  const code = localeMap[locale] || 'es';
  return loadLocale(code);
}
