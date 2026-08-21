jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { PostHogService } from '../shared/observability/posthog.service';
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
      { captureUserJoinedOrg } as unknown as PostHogService,
    );

    await service.create('user-1', { name: 'Org' } as never);

    expect(captureUserJoinedOrg).toHaveBeenCalledWith('user-1', {
      organizationId: 'org-1',
      organizationUnitId: 'ou-1',
      source: 'organization_created',
    });
  });
});
