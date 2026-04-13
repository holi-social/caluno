import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';

import { ADMIN_SESSION_COOKIE_NAME } from './admin-iron-session-constants';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

function adminTtlSeconds(): number {
  const raw = process.env.ADMIN_SESSION_MAX_AGE_SECONDS;
  if (!raw) return DEFAULT_TTL_SECONDS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_SECONDS;
}

/** iron-session requires password length ≥ 32. */
export function isAdminSessionConfigured(): boolean {
  const p = process.env.ADMIN_SESSION_SECRET;
  return typeof p === 'string' && p.length >= 32;
}

export function getAdminIronSessionOptions(): SessionOptions {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be at least 32 characters (required by iron-session)',
    );
  }
  return {
    cookieName: ADMIN_SESSION_COOKIE_NAME,
    password,
    ttl: adminTtlSeconds(),
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

export type AdminSessionData = {
  isLoggedIn?: boolean;
};

export async function getAdminSession() {
  return getIronSession<AdminSessionData>(await cookies(), getAdminIronSessionOptions());
}
