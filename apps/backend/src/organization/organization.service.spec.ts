jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { PermissionKey } from '../auth/enums';
import { PostHogCaptureService } from '../shared/observability/posthog.capture.service';
import { OrganizationService } from './organization.service';

describe('OrganizationService.create PostHog', () => {
  it('captures user_joined_org when an organization is created', async () => {
    const captureUserJoinedOrg = jest.fn();
    const db = {
      transaction: jest
        .fn()
        .mockResolvedValue([{ id: 'org-1', name: 'Org' }, { id: 'ou-1' }]),
    };
    const mapper = {
      toModelOrThrow: jest.fn().mockReturnValue({ id: 'org-1' }),
    };
    const notificationService = {
      notifyOrganizationCreated: jest.fn(),
    };

    const service = new OrganizationService(
      db as never,
      mapper as never,
      {} as never,
      {} as never,
      notificationService as never,
      {} as never,
      { captureUserJoinedOrg } as unknown as PostHogCaptureService,
    );

    await service.create('user-1', { name: 'Org' } as never);

    expect(captureUserJoinedOrg).toHaveBeenCalledWith('user-1', {
      organizationId: 'org-1',
      organizationUnitId: 'ou-1',
      source: 'organization_created',
    });
  });
});

describe('OrganizationService.findUnitsWithPermission', () => {
  it('returns only units reachable from memberships with the given permission', async () => {
    const membershipsFindMany = jest
      .fn()
      .mockResolvedValue([
        { organizationUnit: { id: 'unit-1', organizationId: 'org-1' } },
      ]);
    const organizationUnitsFindMany = jest.fn().mockResolvedValue([
      {
        id: 'unit-1',
        name: 'Unit One',
        organizationId: 'org-1',
        parentId: null,
        deletedAt: null,
      },
      {
        id: 'unit-2',
        name: 'Unit Two',
        organizationId: 'org-1',
        parentId: 'unit-1',
        deletedAt: null,
      },
    ]);
    const db = {
      query: {
        memberships: { findMany: membershipsFindMany },
        organizationUnits: { findMany: organizationUnitsFindMany },
      },
    };

    const service = new OrganizationService(
      db as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.findUnitsWithPermission(
      'user-1',
      PermissionKey.CHECK_IN_MANAGE,
    );

    expect(membershipsFindMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        roles: {
          role: {
            permissions: {
              permission: { key: PermissionKey.CHECK_IN_MANAGE },
            },
          },
        },
      },
      with: {
        organizationUnit: {
          columns: { id: true, organizationId: true },
        },
      },
    });
    // unit-1 (direct membership) and unit-2 (its child) are both reachable.
    expect(result.map((unit) => unit.id).sort()).toEqual(['unit-1', 'unit-2']);
  });
});
