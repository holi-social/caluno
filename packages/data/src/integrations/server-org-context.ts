import type { DataClient } from '../client/data-client';
import { LAST_ORG_COOKIE } from '../constants';

export interface OrgContextData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface ServerOrgContextDeps {
  getCookie: (name: string) => Promise<string | null>;
  notFound: () => never;
  redirect: (path: string) => never;
  getDataClient: (orgUId?: string) => Promise<DataClient>;
}

export function createServerOrgContext(deps: ServerOrgContextDeps) {
  const { getCookie, notFound, redirect, getDataClient } = deps;
  async function resolveOrgFromId(orgUId: string): Promise<OrgContextData> {
    try {
      const data = await getDataClient(orgUId);
      const org = await data.organization.findById(orgUId);

      if (!org) {
        return notFound();
      }

      return org;
    } catch (error) {
      console.error('Failed to resolve org from ID:', error);
      return notFound();
    }
  }
  async function resolveOrgFromSlug(orgSlug: string): Promise<OrgContextData> {
    try {
      const data = await getDataClient();
      const org = await data.organization.findBySlug(orgSlug);

      if (!org) {
        return notFound();
      }

      return org;
    } catch (error) {
      console.error('Failed to resolve org from slug:', error);
      return notFound();
    }
  }

  async function validateUserOrgAccess(orgUId: string): Promise<boolean> {
    try {
      const data = await getDataClient();
      const myOrgs = await data.user.getMyOrganizations({
        limit: 100,
        offset: 0,
      });

      return myOrgs.items.some((org) => org.id === orgUId);
    } catch (error) {
      console.error('Failed to validate org access:', error);
      return false;
    }
  }

  async function requireOrgAccess(
    orgUId: string,
  ): Promise<{ org: OrgContextData; organizations: OrgContextData[] }> {
    const data = await getDataClient(orgUId);
    const [org, myOrgsResult] = await Promise.all([
      data.organization.findById(orgUId),
      data.user.getMyOrganizations({ limit: 100, offset: 0 }),
    ]);

    if (!org) {
      notFound();
    }

    const hasAccess = myOrgsResult.items.some((o) => o.id === org.id);

    if (!hasAccess) {
      redirect('/unauthorized');
    }

    return {
      org,
      organizations: myOrgsResult.items,
    };
  }

  async function getLastVisitedOrgServer(): Promise<string | null> {
    return getCookie(LAST_ORG_COOKIE);
  }

  return {
    resolveOrgFromId,
    resolveOrgFromSlug,
    validateUserOrgAccess,
    requireOrgAccess,
    getLastVisitedOrgServer,
  };
}
