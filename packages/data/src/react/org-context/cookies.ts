'use client';

import Cookies from 'js-cookie';
import { LAST_ORG_COOKIE } from '../../constants';
export { LAST_ORG_COOKIE };

export function setLastVisitedOrg(orgId: string): void {
  Cookies.set(LAST_ORG_COOKIE, orgId, {
    expires: 365,
    sameSite: 'lax',
  });
}

export function getLastVisitedOrg(): string | null {
  return Cookies.get(LAST_ORG_COOKIE) ?? null;
}

export function clearLastVisitedOrg(): void {
  Cookies.remove(LAST_ORG_COOKIE);
}
