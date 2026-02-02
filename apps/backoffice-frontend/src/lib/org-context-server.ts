import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { LAST_ORG_COOKIE } from './constants';
import { getDataClient } from './data-client';

export interface OrgContextData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

export async function resolveOrgFromSlug(
  orgSlug: string,
): Promise<OrgContextData> {
  try {
    const data = await getDataClient();
    const org = await data.organization.findBySlug(orgSlug);

    if (!org) {
      notFound();
    }

    return org;
  } catch (error) {
    console.error('Failed to resolve org from slug:', error);
    notFound();
  }
}

export async function validateUserOrgAccess(orgId: string): Promise<boolean> {
  try {
    const data = await getDataClient();
    const myOrgs = await data.user.getMyOrganizations({
      limit: 100,
      offset: 0,
    });

    return myOrgs.items.some((org) => org.id === orgId);
  } catch (error) {
    console.error('Failed to validate org access:', error);
    return false;
  }
}

export async function requireOrgAccess(
  orgSlug: string,
): Promise<OrgContextData> {
  const org = await resolveOrgFromSlug(orgSlug);
  const hasAccess = await validateUserOrgAccess(org.id);

  if (!hasAccess) {
    redirect('/unauthorized');
  }

  return org;
}

export async function getLastVisitedOrgServer(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_ORG_COOKIE)?.value ?? null;
}
