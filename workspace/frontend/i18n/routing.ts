export const locales = ['es', 'pt'] as const;
export const defaultLocale = 'es';
export const cookieName = 'NEXT_LOCALE';

export type Locale = (typeof locales)[number];
