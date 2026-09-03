import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { OrgContextData } from '../org-context-server';

const cookieValues = new Map<string, string>();
const accessibleOrgs: OrgContextData[] = [];
let lastVisitedOrgId: string | null = null;

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
  }),
}));

mock.module('../org-context-server', () => ({
  getMyAdministrableOrgUnits: async () => accessibleOrgs,
  getLastVisitedOrgServer: async () => lastVisitedOrgId,
}));

const { resolveAuthPageRedirects } = await import('../auth-page-redirect');

const lastOrg: OrgContextData = {
  id: 'last-org',
  slug: 'last-org',
  name: 'Last Org',
  organizationId: 'last-org',
  accountingEnabled: false,
};

describe('resolveAuthPageRedirects', () => {
  beforeEach(() => {
    cookieValues.clear();
    accessibleOrgs.length = 0;
    lastVisitedOrgId = null;
  });

  describe('authenticatedRedirect', () => {
    it('returns explicit redirectTo from search params', async () => {
      const { authenticatedRedirect } = await resolveAuthPageRedirects({
        redirectTo: '/admin/org-1',
      });

      expect(await authenticatedRedirect()).toBe('/admin/org-1');
    });

    it('falls back to resolvePostAuthDestination when no explicit redirect', async () => {
      accessibleOrgs.push(lastOrg);
      lastVisitedOrgId = lastOrg.id;

      const { authenticatedRedirect } = await resolveAuthPageRedirects({});

      expect(await authenticatedRedirect()).toBe('/admin/last-org');
    });

    it('returns invite destination from pending_invite cookie', async () => {
      cookieValues.set('pending_invite', 'token-abc');

      const { authenticatedRedirect } = await resolveAuthPageRedirects({});

      expect(await authenticatedRedirect()).toBe('/invite/token-abc');
    });

    it('prefers explicit redirect over pending_invite cookie', async () => {
      cookieValues.set('pending_invite', 'token-abc');

      const { authenticatedRedirect } = await resolveAuthPageRedirects({
        redirectTo: '/admin/org-1',
      });

      expect(await authenticatedRedirect()).toBe('/admin/org-1');
    });

    it('prefers pending_redirect cookie over url redirectTo', async () => {
      cookieValues.set('pending_redirect', '/admin/from-cookie');

      const { authenticatedRedirect } = await resolveAuthPageRedirects({
        redirectTo: '/admin/from-url',
      });

      expect(await authenticatedRedirect()).toBe('/admin/from-cookie');
    });
  });

  describe('formRedirectTo', () => {
    it('passes explicit redirectTo to the auth form', async () => {
      const { formRedirectTo } = await resolveAuthPageRedirects({
        redirectTo: '/admin/org-1',
      });

      expect(formRedirectTo).toBe('/admin/org-1');
    });

    it('defaults to / when no redirect or invite is present', async () => {
      const { formRedirectTo } = await resolveAuthPageRedirects({});

      expect(formRedirectTo).toBe('/');
    });

    it('uses invite destination from pending_invite cookie', async () => {
      cookieValues.set('pending_invite', 'token-abc');

      const { formRedirectTo } = await resolveAuthPageRedirects({});

      expect(formRedirectTo).toBe('/invite/token-abc');
    });

    it('ignores unsafe redirectTo values', async () => {
      const { formRedirectTo } = await resolveAuthPageRedirects({
        redirectTo: '//evil.example',
      });

      expect(formRedirectTo).toBe('/');
    });

    it('treats redirectTo=/ as no explicit redirect', async () => {
      const { formRedirectTo } = await resolveAuthPageRedirects({
        redirectTo: '/',
      });

      expect(formRedirectTo).toBe('/');
    });
  });
});
