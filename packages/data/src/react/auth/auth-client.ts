'use client';
import type { BetterAuthClientOptions } from 'better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import type { Session } from 'better-auth/types';
import { LOCALE_HEADER } from '../../constants';
import { clearLastVisitedOrg } from '../org-context';
import { clearLocaleCookie } from './locale-cookie';
import { readRequestLocale } from './read-request-locale';

type CalunoAuthClientOptions = BetterAuthClientOptions & {
  baseURL: string;
  plugins: [ReturnType<typeof emailOTPClient>];
};

type BaseReactAuthClient = ReturnType<
  typeof createBetterAuthClient<CalunoAuthClientOptions>
>;

export type AuthClient = Omit<BaseReactAuthClient, 'signOut'> & {
  signOut: BaseReactAuthClient['signOut'];
};

export function createAuthClient(baseURL: string): AuthClient {
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
    clearLocaleCookie();
    return await client.signOut(...args);
  };

  return Object.assign(client, { signOut });
}

export type { Session };
