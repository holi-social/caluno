'use client';

import Cookies from 'js-cookie';
import { LOCALE_COOKIE } from '../../constants';

/**
 * Clear the `clippy.locale` preference cookie. Called on sign-out so a stored
 * preference does not leak into the next (logged-out or different) user; the
 * proxy only applies the preference while authenticated anyway.
 */
export function clearLocaleCookie(): void {
  Cookies.remove(LOCALE_COOKIE, { path: '/' });
}
