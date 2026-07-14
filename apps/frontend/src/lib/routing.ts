import {
  getLastVisitedOrgServer,
  getMyAdministrableOrgUnits,
} from './org-context-server';

export async function resolvePostAuthDestination(): Promise<string> {
  const orgs = await getMyAdministrableOrgUnits();

  if (orgs.length === 0) {
    return '/';
  }

  const lastOrgUId = await getLastVisitedOrgServer();
  if (lastOrgUId && orgs.some((org) => org.id === lastOrgUId)) {
    return `/admin/${lastOrgUId}`;
  }

  return '/';
}

export async function resolveAdminDestination(): Promise<string | null> {
  const orgs = await getMyAdministrableOrgUnits();

  if (orgs.length === 0) {
    return null;
  }

  const lastOrgUId = await getLastVisitedOrgServer();
  if (lastOrgUId && orgs.some((org) => org.id === lastOrgUId)) {
    return `/admin/${lastOrgUId}`;
  }

  return `/admin/${orgs[0]?.id}`;
}
