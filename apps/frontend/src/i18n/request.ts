import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` comes from the `[locale]` segment (added in a later subtask).
  // Until then it is undefined and we fall back to the default locale.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    timeZone: 'Europe/Berlin',
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
