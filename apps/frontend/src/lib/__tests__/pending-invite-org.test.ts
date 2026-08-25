import { beforeEach, describe, expect, it, mock } from 'bun:test';

const cookieValues = new Map<string, string>();
const findById = mock(async (_id: string) => ({
  id: 'org-1',
  name: 'Playground',
  logoUrl: 'https://example.com/logo.png',
}));

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
  }),
}));

mock.module('../data-client', () => ({
  getDataClient: async () => ({
    publicOrganizationUnit: { findById },
  }),
}));

const { resolvePendingInviteOrg } = await import('../pending-invite-org');

describe('resolvePendingInviteOrg', () => {
  beforeEach(() => {
    cookieValues.clear();
    findById.mockClear();
    findById.mockImplementation(async (id: string) => ({
      id,
      name: 'Playground',
      logoUrl: 'https://example.com/logo.png',
    }));
  });

  it('returns null when pending_invite cookie is absent', async () => {
    await expect(resolvePendingInviteOrg()).resolves.toBeNull();
    expect(findById).not.toHaveBeenCalled();
  });

  it('loads name and logo for the pending invite org unit', async () => {
    cookieValues.set('pending_invite', 'org-1');

    await expect(resolvePendingInviteOrg()).resolves.toEqual({
      id: 'org-1',
      name: 'Playground',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(findById).toHaveBeenCalledWith('org-1');
  });

  it('prefers an explicit org unit id over the cookie', async () => {
    cookieValues.set('pending_invite', 'cookie-org');

    await expect(resolvePendingInviteOrg('override-org')).resolves.toEqual({
      id: 'override-org',
      name: 'Playground',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(findById).toHaveBeenCalledWith('override-org');
  });

  it('uses an explicit org unit id when the cookie is absent', async () => {
    await expect(resolvePendingInviteOrg('org-from-query')).resolves.toEqual({
      id: 'org-from-query',
      name: 'Playground',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(findById).toHaveBeenCalledWith('org-from-query');
  });

  it('returns null when the public org lookup fails', async () => {
    cookieValues.set('pending_invite', 'missing');
    findById.mockImplementation(async () => {
      throw new Error('not found');
    });

    await expect(resolvePendingInviteOrg()).resolves.toBeNull();
  });
});
