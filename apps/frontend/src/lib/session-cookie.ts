import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';

/**
 * Edge-safe, cookie-only session presence check for middleware (`proxy.ts`).
 * Reads the Better Auth session cookie without a DB/API call — an optimistic
 * check, not a validated session. Kept in its own module (not `auth-server.ts`)
 * so the edge bundle never pulls `next/headers`.
 */
export function hasSessionCookie(request: NextRequest): boolean {
  return getSessionCookie(request) !== null;
}
