jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { PermissionKey } from '../auth/enums';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { OrganizationService } from './organization.service';

describe('OrganizationService.create PostHog', () => {
  it('captures organization_create and organization_join when an organization is created', async () => {
    const capture = jest.fn();
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
      { capture } as unknown as PostHogService,
    );

    await service.create('user-1', { name: 'Org' } as never);

    expect(capture).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenNthCalledWith(1, {
      event: POSTHOG_EVENT.ORGANIZATION_CREATE,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
      },
    });
    expect(capture).toHaveBeenNthCalledWith(2, {
      event: POSTHOG_EVENT.ORGANIZATION_JOIN,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'organization_create',
      },
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
