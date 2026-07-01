'use client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import type { Session } from 'better-auth/types';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  type Locale,
  SUPPORTED_LOCALES,
} from '../../constants';
import { clearLastVisitedOrg } from '../org-context';

function readLocaleCookie(): Locale | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];

  if (cookieValue && SUPPORTED_LOCALES.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }

  return undefined;
}

function readLocaleFromPathname(): Locale | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const segment = window.location.pathname.split('/').filter(Boolean)[0];
  if (segment && SUPPORTED_LOCALES.includes(segment as Locale)) {
    return segment as Locale;
  }

  return undefined;
}

function readRequestLocale(): Locale {
  return readLocaleCookie() ?? readLocaleFromPathname() ?? DEFAULT_LOCALE;
}

export function createAuthClient(baseURL: string) {
  const client = createBetterAuthClient({
    baseURL,
    plugins: [emailOTPClient()],
    fetchOptions: {
      onRequest: (context) => {
        context.headers.set(LOCALE_HEADER, readRequestLocale());
      },
    },
  });

  const signOut = async (...args: Parameters<typeof client.signOut>) => {
    clearLastVisitedOrg();
    return await client.signOut(...args);
  };

  return Object.assign(client, { signOut });
}

export type AuthClient = ReturnType<typeof createAuthClient>;
export type { Session };
