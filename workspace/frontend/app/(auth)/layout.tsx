import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { flatMessagesToNested } from '@/i18n/messages';
import type { ReactNode } from 'react';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = flatMessagesToNested(
    (await import(`../../messages/${locale}.json`)).default,
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
