'use client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import type { Session } from 'better-auth/types';
import { LOCALE_HEADER } from '../../constants';
import { clearLastVisitedOrg } from '../org-context';
import { readRequestLocale } from './read-request-locale';

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
