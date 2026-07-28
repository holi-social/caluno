import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Supported locales. `en` is the source/fallback language.
  locales: ['en', 'de'],
  defaultLocale: 'en',
  // localePrefix defaults to 'always' → every path is prefixed (/en/…, /de/…).
  // We manage the preference cookie ourselves (`clippy.locale`) so next-intl
  // does not rewrite it on every navigation.
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];

export function resolveLocale(locale: string): Locale {
  return (routing.locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : routing.defaultLocale;
}
