import { type Locale, SUPPORTED_LOCALES } from '@repo/data';
import Cookies from 'js-cookie';
import { USER_LOCALE_COOKIE } from './locale-constants';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  path: '/',
  sameSite: 'lax',
  expires: 365,
};

export function getLocaleCookie(): Locale | undefined {
  const value = Cookies.get(USER_LOCALE_COOKIE);
  return value as Locale | undefined;
}

export function setLocaleCookie(locale: Locale): void {
  Cookies.set(USER_LOCALE_COOKIE, locale, COOKIE_OPTIONS);
}

/**
 * Sets the locale preference cookie when the value is a supported locale.
 * Returns the validated locale or `null` when the value is unsupported/missing.
 */
export function setLocaleCookieIfSupported(value: unknown): Locale | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (!SUPPORTED_LOCALES.includes(value as Locale)) {
    return null;
  }

  setLocaleCookie(value as Locale);
  return value as Locale;
}

export function deleteLocaleCookie(): void {
  Cookies.remove(USER_LOCALE_COOKIE, { path: '/' });
}
