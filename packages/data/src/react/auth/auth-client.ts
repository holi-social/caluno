'use client';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';

export function createAuthClient(baseURL: string) {
  return createBetterAuthClient({
    baseURL,
  });
}
