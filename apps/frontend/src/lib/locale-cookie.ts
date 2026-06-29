import Cookies from 'js-cookie';
import type { Locale } from '@/i18n/routing';
import { USER_LOCALE_COOKIE } from './locale-constants';

export function setUserLocaleCookie(locale: Locale): void {
  Cookies.set(USER_LOCALE_COOKIE, locale, { path: '/', sameSite: 'Lax' });
}

export function removeUserLocaleCookie(): void {
  Cookies.remove(USER_LOCALE_COOKIE, { path: '/' });
}
