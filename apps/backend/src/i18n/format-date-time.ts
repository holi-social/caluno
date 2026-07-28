import type { Locale } from '../graphql/locale';

const DEFAULT_TIME_ZONE = 'Europe/Berlin';

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
  return new Intl.DateTimeFormat(locale, localeDateTimeOptions).format(date);
}
