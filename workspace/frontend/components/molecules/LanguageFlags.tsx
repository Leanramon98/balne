'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
] as const;

function getLocaleFromCookie(): string {
  if (typeof window === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match?.[1] || 'es';
}

function setLocaleCookie(locale: string): void {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export function LanguageFlags() {
  const currentLocale = getLocaleFromCookie();

  const handleChange = useCallback((newLocale: string) => {
    if (newLocale === currentLocale) return;
    setLocaleCookie(newLocale);
    window.location.reload();
  }, [currentLocale]);

  return (
    <div className="flex items-center gap-0.5 border border-zinc-200 rounded-lg p-0.5 h-9">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          title={l.label}
          className={cn(
            'flex items-center justify-center w-8 h-7 rounded-md text-sm transition-colors cursor-pointer',
            currentLocale === l.code
              ? 'bg-blue-100 shadow-sm'
              : 'hover:bg-zinc-100 text-zinc-400',
          )}
          aria-pressed={currentLocale === l.code}
          aria-label={l.label}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
