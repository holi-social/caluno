import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { OrgContextData } from '../org-context-server';
import { resolveAdminDestination } from '../routing';

const administrableOrgs: OrgContextData[] = [];
let lastVisitedOrgId: string | null = null;

mock.module('../org-context-server', () => ({
  getMyAdministrableOrgUnits: async () => administrableOrgs,
  getLastVisitedOrgServer: async () => lastVisitedOrgId,
}));

const { resolvePostAuthDestination } = await import('../routing');

const orgUnit: OrgContextData = {
  id: 'org-unit-1',
  slug: 'org-unit-1',
  name: 'Org Unit 1',
  organizationId: 'org-1',
};

const anotherOrgUnit: OrgContextData = {
  id: 'org-unit-2',
  slug: 'org-unit-2',
  name: 'Org Unit 2',
  organizationId: 'org-2',
};

describe('routing', () => {
  describe('resolvePostAuthDestination', () => {
    beforeEach(() => {
      administrableOrgs.length = 0;
      lastVisitedOrgId = null;
    });

    it('returns / when the user has no accessible organization units', async () => {
      expect(await resolvePostAuthDestination()).toBe('/');
    });

    it('returns / when orgs exist but no last visited cookie is set', async () => {
      administrableOrgs.push(orgUnit);

      expect(await resolvePostAuthDestination()).toBe('/');
    });

    it('returns /admin/{id} when last visited cookie matches an accessible org unit', async () => {
      administrableOrgs.push(orgUnit);
      lastVisitedOrgId = orgUnit.id;

      expect(await resolvePostAuthDestination()).toBe('/admin/org-unit-1');
    });

    it('returns / when last visited cookie does not match an accessible org unit', async () => {
      administrableOrgs.push(orgUnit);
      lastVisitedOrgId = 'other-org-unit';

      expect(await resolvePostAuthDestination()).toBe('/');
    });
  });

  describe('resolveAdminDestination', () => {
    beforeEach(() => {
      administrableOrgs.length = 0;
      lastVisitedOrgId = null;
    });

    it('Resolves to nowhere, when the user has no accessible organization units', async () => {
      expect(await resolveAdminDestination()).toBeNull();
    });

    it('Resolves to previously visited org unit, when last visited cookie matches an accessible org unit', async () => {
      administrableOrgs.push(orgUnit);
      administrableOrgs.push(anotherOrgUnit);

      lastVisitedOrgId = anotherOrgUnit.id;

      expect(await resolveAdminDestination()).toBe('/admin/org-unit-2');
    });

    it('Resolves to first org unit, when orgs exist but no last visited cookie is set', async () => {
      administrableOrgs.push(orgUnit);
      administrableOrgs.push(anotherOrgUnit);

      expect(await resolveAdminDestination()).toBe('/admin/org-unit-1');
    });

    it('Resolves to first org unit, when last visited cookie does not match an accessible org unit', async () => {
      administrableOrgs.push(orgUnit);
      administrableOrgs.push(anotherOrgUnit);
      lastVisitedOrgId = 'some-other-org-unit';

      expect(await resolveAdminDestination()).toBe('/admin/org-unit-1');
    });
  });
});
