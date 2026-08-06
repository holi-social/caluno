import type { Locale } from '@repo/data';

export const LOCALES: { key: Locale; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
];

export const localeLabel = (locale: Locale | string): string =>
  LOCALES.find((entry) => entry.key === locale)?.label ?? locale;
