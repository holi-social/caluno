'use client';

import Cookies from 'js-cookie';
import { useParams } from 'next/navigation';
import { LAST_ORG_COOKIE } from './constants';

export function useCurrentOrgSlug(): string | null {
  const params = useParams();
  return (params.orgSlug as string) ?? null;
}

export function setLastVisitedOrg(orgSlug: string): void {
  Cookies.set(LAST_ORG_COOKIE, orgSlug, {
    expires: 365, // 1 year
    sameSite: 'lax',
  });
}

export function getLastVisitedOrg(): string | null {
  return Cookies.get(LAST_ORG_COOKIE) ?? null;
}

export function clearLastVisitedOrg(): void {
  Cookies.remove(LAST_ORG_COOKIE);
}
