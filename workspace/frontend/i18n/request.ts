import { getRequestConfig } from 'next-intl/server';
import { flatMessagesToNested } from './messages';
import { locales, defaultLocale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(locales as readonly string[]).includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: flatMessagesToNested((await import(`../messages/${locale}.json`)).default),
  };
});
