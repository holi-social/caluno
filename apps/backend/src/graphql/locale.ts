export const LOCALE_HEADER = 'x-locale';
export const ACCEPT_LANGUAGE_HEADER = 'accept-language';
export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export const DEFAULT_LOCALE: Locale = 'de';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES);

export function parseLocaleHeader(value: unknown): Locale | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;

  const locale = raw.trim().toLowerCase().split('-')[0];
  return supportedLocaleSet.has(locale) ? (locale as Locale) : undefined;
}

export function parseAcceptLanguageHeader(value: unknown): Locale | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;

  const locales = raw
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase().split('-')[0])
    .filter(
      (locale): locale is string =>
        typeof locale === 'string' && locale.length > 0,
    );

  for (const locale of locales) {
    if (supportedLocaleSet.has(locale)) {
      return locale as Locale;
    }
  }

  return undefined;
}

export function resolveRequestLocale(headers: Record<string, unknown>): Locale {
  return (
    parseLocaleHeader(headers[LOCALE_HEADER]) ??
    parseAcceptLanguageHeader(headers[ACCEPT_LANGUAGE_HEADER]) ??
    DEFAULT_LOCALE
  );
}
