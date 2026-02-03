'use client';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import type { Session } from 'better-auth/types';
import { clearLastVisitedOrg } from '../org-context';

export function createAuthClient(baseURL: string) {
  const client = createBetterAuthClient({
    baseURL,
  });

  const signOut = async (...args: Parameters<typeof client.signOut>) => {
    clearLastVisitedOrg();
    return await client.signOut(...args);
  };

  return Object.assign(client, { signOut });
}

export type AuthClient = ReturnType<typeof createAuthClient>;
export type { Session };
