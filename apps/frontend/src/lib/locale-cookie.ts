import type { Locale } from '@repo/data';
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

export function deleteLocaleCookie(): void {
  Cookies.remove(USER_LOCALE_COOKIE, { path: '/' });
}
