import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Supported locales. `en` is the source/fallback language.
  locales: ['en', 'de'],
  defaultLocale: 'en',
  // localePrefix defaults to 'always' → every path is prefixed (/en/…, /de/…).
});

export type Locale = (typeof routing.locales)[number];
