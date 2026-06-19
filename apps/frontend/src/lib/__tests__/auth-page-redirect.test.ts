import { beforeEach, describe, expect, it, mock } from 'bun:test';

const cookieValues = new Map<string, string>();
let postAuthDestination = '/organizations';

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
  }),
}));

mock.module('../post-auth-routing', () => ({
  resolvePostAuthDestination: async () => postAuthDestination,
}));

const { resolveAuthPageRedirects } = await import('../auth-page-redirect');

describe('resolveAuthPageRedirects', () => {
  beforeEach(() => {
    cookieValues.clear();
    postAuthDestination = '/organizations';
  });

  describe('authenticatedRedirect', () => {
    it('returns explicit redirectTo from search params', async () => {
      const { authenticatedRedirect } = await resolveAuthPageRedirects({
        redirectTo: '/admin/org-1',
      });

      expect(await authenticatedRedirect()).toBe('/admin/org-1');
    });

    it('falls back to resolvePostAuthDestination when no explicit redirect', async () => {
      postAuthDestination = '/admin/last-org';

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
