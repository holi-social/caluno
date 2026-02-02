'use client';

import Cookies from 'js-cookie';
import { ORG_CONTEXT_COOKIE } from './constants';

export function getCurrentOrganizationId(): string | null {
  return Cookies.get(ORG_CONTEXT_COOKIE) ?? null;
}

export function setCurrentOrganizationId(orgId: string): void {
  Cookies.set(ORG_CONTEXT_COOKIE, orgId, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: 30,
    path: '/',
  });
}

export function clearCurrentOrganizationId(): void {
  Cookies.remove(ORG_CONTEXT_COOKIE);
}
