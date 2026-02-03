import { createServerOrgContext } from '@repo/data';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getDataClient } from './data-client';

export const {
  requireOrgAccess,
  resolveOrgFromSlug,
  validateUserOrgAccess,
  getLastVisitedOrgServer,
} = createServerOrgContext({
  getCookie: async (name) => {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value ?? null;
  },
  notFound,
  redirect,
  getDataClient,
});

export type { OrgContextData } from '@repo/data';
