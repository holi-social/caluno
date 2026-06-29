export const LOCALE_HEADER = 'x-locale';
export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES);

export function parseLocaleHeader(value: unknown): Locale | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;

  const locale = raw.trim().toLowerCase().split('-')[0];
  return supportedLocaleSet.has(locale) ? (locale as Locale) : undefined;
}

export function resolveRequestLocale(headers: Record<string, unknown>): Locale {
  return parseLocaleHeader(headers[LOCALE_HEADER]) ?? DEFAULT_LOCALE;
}
