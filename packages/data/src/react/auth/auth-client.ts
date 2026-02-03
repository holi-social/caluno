'use client';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';
import type { Session } from 'better-auth/types';
import { clearLastVisitedOrg } from '../org-context';

export function createAuthClient(baseURL: string) {
  const client = createBetterAuthClient({
    baseURL,
  });

  return {
    ...client,
    useSession: client.useSession,
    signOut: () => {
      clearLastVisitedOrg();
      client.signOut();
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
export type { Session };
