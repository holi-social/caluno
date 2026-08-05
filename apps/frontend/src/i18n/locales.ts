import type { Locale } from '@repo/data';

export const LOCALES = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
] as const satisfies ReadonlyArray<{ key: Locale; label: string }>;

export const localeLabel = (locale: Locale | string): string =>
  LOCALES.find((entry) => entry.key === locale)?.label ?? locale;
