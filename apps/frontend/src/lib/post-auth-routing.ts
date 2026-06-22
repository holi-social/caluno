import {
  getLastVisitedOrgServer,
  getMyAccessibleOrganizationUnits,
} from './org-context-server';

export async function resolvePostAuthDestination(): Promise<string> {
  const orgs = await getMyAccessibleOrganizationUnits();

  if (orgs.length === 0) {
    return '/';
  }

  const lastOrgUId = await getLastVisitedOrgServer();
  if (lastOrgUId && orgs.some((org) => org.id === lastOrgUId)) {
    return `/admin/${lastOrgUId}`;
  }

  return '/organizations';
}
