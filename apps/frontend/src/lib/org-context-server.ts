import { LAST_ORG_COOKIE } from '@repo/data';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getDataClient } from './data-client';

export interface OrgContextData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  organizationId: string;
}

export async function getMyRootOrganizationUnits(): Promise<OrgContextData[]> {
  const data = await getDataClient();
  const organizations = await data.organization.findAllWithRoot();

  return organizations.map((organization) => ({
    id: organization.root.id,
    slug: organization.root.slug,
    name: organization.name,
    description: organization.description ?? organization.root.description,
    logoUrl: organization.logoUrl ?? organization.root.logoUrl,
    address: organization.root.address ?? null,
    organizationId: organization.id,
  }));
}

export async function resolveOrgFromId(
  orgUId: string,
): Promise<OrgContextData> {
  const organizations = await getMyRootOrganizationUnits();
  const org =
    organizations.find((item) => item.id === orgUId) ??
    organizations.find((item) => item.organizationId === orgUId);
  if (!org) {
    return notFound();
  }
  return org;
}

export async function resolveOrgFromSlug(
  orgSlug: string,
): Promise<OrgContextData> {
  const organizations = await getMyRootOrganizationUnits();
  const org = organizations.find((item) => item.slug === orgSlug);
  if (!org) {
    return notFound();
  }
  return org;
}

export async function validateUserOrgAccess(orgUId: string): Promise<boolean> {
  const organizations = await getMyRootOrganizationUnits();
  return organizations.some(
    (item) => item.id === orgUId || item.organizationId === orgUId,
  );
}

export async function requireOrgAccess(
  orgUId: string,
): Promise<{ org: OrgContextData; organizations: OrgContextData[] }> {
  const organizations = await getMyRootOrganizationUnits();
  const org = organizations.find((item) => item.id === orgUId);
  const legacyOrg = organizations.find(
    (item) => item.organizationId === orgUId,
  );

  if (!org && legacyOrg) {
    redirect(`/${legacyOrg.id}`);
  }

  if (!org) {
    redirect('/unauthorized');
  }

  return { org, organizations };
}

export async function getLastVisitedOrgServer(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_ORG_COOKIE)?.value ?? null;
}
