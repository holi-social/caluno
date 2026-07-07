import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  SUPPORTED_LOCALES,
} from '../../constants';

function readLocaleCookie(): Locale | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];

  if (cookieValue && SUPPORTED_LOCALES.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }

  return undefined;
}

function readLocaleFromPathname(): Locale | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const segment = window.location.pathname.split('/').filter(Boolean)[0];
  if (segment && SUPPORTED_LOCALES.includes(segment as Locale)) {
    return segment as Locale;
  }

  return undefined;
}

/**
 * Resolve the locale for the `x-locale` header on client-side auth requests:
 * the `clippy.locale` preference cookie wins, then the URL locale prefix, then
 * the default locale.
 */
export function readRequestLocale(): Locale {
  return readLocaleCookie() ?? readLocaleFromPathname() ?? DEFAULT_LOCALE;
}
