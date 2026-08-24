jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

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
