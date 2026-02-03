'use client';

import Cookies from 'js-cookie';
import { LAST_ORG_COOKIE } from '../../constants';

// Re-export constant for convenience
export { LAST_ORG_COOKIE };

/**
 * Sets the last visited organization slug in a cookie.
 * @param orgSlug - The organization slug to store
 */
export function setLastVisitedOrg(orgSlug: string): void {
  Cookies.set(LAST_ORG_COOKIE, orgSlug, {
    expires: 365, // 1 year
    sameSite: 'lax',
  });
}

/**
 * Gets the last visited organization slug from cookie.
 * @returns The org slug or null if not set
 */
export function getLastVisitedOrg(): string | null {
  return Cookies.get(LAST_ORG_COOKIE) ?? null;
}

/**
 * Clears the last visited organization cookie.
 * Should be called on logout to prevent org context leaking between accounts.
 */
export function clearLastVisitedOrg(): void {
  Cookies.remove(LAST_ORG_COOKIE);
}
