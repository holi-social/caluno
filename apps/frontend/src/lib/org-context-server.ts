import { LAST_ORG_COOKIE } from '@repo/data';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from './auth-server';
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

export async function getMyAccessibleOrganizationUnits(): Promise<
  OrgContextData[]
> {
  const data = await getDataClient();
  const units = await data.organization.findMyAccessibleOrganizationUnits();

  return units
    .map((unit) => {
      const isRoot = unit.parent === null;
      return {
        id: unit.id,
        slug: unit.slug,
        name: isRoot
          ? unit.organization.name
          : `${unit.organization.name} › ${unit.name}`,
        description: unit.description ?? unit.organization.description ?? null,
        logoUrl: unit.logoUrl ?? unit.organization.logoUrl ?? null,
        address: unit.address,
        organizationId: unit.organization.id,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function validateUserOrgAccess(orgUId: string): Promise<boolean> {
  const organizations = await getMyAccessibleOrganizationUnits();
  return organizations.some(
    (item) => item.id === orgUId || item.organizationId === orgUId,
  );
}

export async function requireOrgAccess(
  orgUId: string,
): Promise<{ org: OrgContextData; organizations: OrgContextData[] }> {
  const organizations = await getMyAccessibleOrganizationUnits();
  const org = organizations.find((item) => item.id === orgUId);
  const legacyOrg = organizations.find(
    (item) => item.organizationId === orgUId,
  );

  if (!org && legacyOrg) {
    redirect(`/admin/${legacyOrg.id}`);
  }

  if (org) {
    return { org, organizations };
  }

  const data = await getDataClient();
  const loggedInUser = await getCurrentUser();
  const isMember = await data.organizationUnit.isMemberOfOrgUnitOrAncestor(
    orgUId,
    loggedInUser.id,
  );
  if (!isMember) {
    redirect('/unauthorized');
  }

  const unit = await data.organizationUnit.findById(orgUId);
  if (!unit) {
    redirect('/unauthorized');
  }

  return {
    org: {
      id: unit.id,
      slug: unit.slug,
      name: unit.name,
      description: unit.description ?? null,
      logoUrl: unit.logoUrl ?? null,
      address: unit.address ?? null,
      organizationId: unit.organizationId ?? '',
    },
    organizations,
  };
}

export async function getLastVisitedOrgServer(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_ORG_COOKIE)?.value ?? null;
}
