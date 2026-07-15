/**
 * Get the current locale from the next-intl cookie (NEXT_LOCALE).
 * Returns undefined when running server-side or when no cookie is set.
 */
export function getCurrentLocale(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match ? match[1] : undefined;
}
