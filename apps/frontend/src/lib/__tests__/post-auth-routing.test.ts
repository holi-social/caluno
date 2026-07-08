import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { OrgContextData } from '../org-context-server';

const accessibleOrgs: OrgContextData[] = [];
let lastVisitedOrgId: string | null = null;

mock.module('../org-context-server', () => ({
  getMyAccessibleOrganizationUnits: async () => accessibleOrgs,
  getLastVisitedOrgServer: async () => lastVisitedOrgId,
}));

const { resolvePostAuthDestination } = await import('../post-auth-routing');

const orgUnit: OrgContextData = {
  id: 'org-unit-1',
  slug: 'org-unit-1',
  name: 'Org Unit 1',
  organizationId: 'org-1',
};

describe('resolvePostAuthDestination', () => {
  beforeEach(() => {
    accessibleOrgs.length = 0;
    lastVisitedOrgId = null;
  });

  it('returns / when the user has no accessible organization units', async () => {
    expect(await resolvePostAuthDestination()).toBe('/');
  });

  it('returns / when orgs exist but no last visited cookie is set', async () => {
    accessibleOrgs.push(orgUnit);

    expect(await resolvePostAuthDestination()).toBe('/');
  });

  it('returns /admin/{id} when last visited cookie matches an accessible org unit', async () => {
    accessibleOrgs.push(orgUnit);
    lastVisitedOrgId = orgUnit.id;

    expect(await resolvePostAuthDestination()).toBe('/admin/org-unit-1');
  });

  it('returns / when last visited cookie does not match an accessible org unit', async () => {
    accessibleOrgs.push(orgUnit);
    lastVisitedOrgId = 'other-org-unit';

    expect(await resolvePostAuthDestination()).toBe('/');
  });
});
