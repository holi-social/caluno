import type { Locale } from '../graphql/locale';

const DEFAULT_TIME_ZONE = 'Europe/Berlin';

/** Message locale (en/de) vs ICU formatting locale — dates/times always use DE conventions. */
const FORMATTING_LOCALE: Record<Locale, string> = {
  en: 'en-DE',
  de: 'de-DE',
};

function formattingLocale(locale: Locale): string {
  return FORMATTING_LOCALE[locale];
}

const localeDateTimeOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: DEFAULT_TIME_ZONE,
} as const satisfies Intl.DateTimeFormatOptions;

export function formatLocaleDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(
    formattingLocale(locale),
    localeDateTimeOptions,
  ).format(date);
}

const localeDateOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: DEFAULT_TIME_ZONE,
} as const satisfies Intl.DateTimeFormatOptions;

const localeTimeOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: DEFAULT_TIME_ZONE,
} as const satisfies Intl.DateTimeFormatOptions;

export function formatLocaleDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(
    formattingLocale(locale),
    localeDateOptions,
  ).format(date);
}

export function formatLocaleTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(
    formattingLocale(locale),
    localeTimeOptions,
  ).format(date);
}

export function formatLocaleList(
  items: string[],
  locale: Locale,
  type: Intl.ListFormatType = 'conjunction',
): string {
  return new Intl.ListFormat(formattingLocale(locale), { type }).format(items);
}

// gives the date in YYYY-MM-DD format
export function numericCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
