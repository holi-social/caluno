jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { MembershipService } from './membership.service';

function createService(options: {
  membershipCount: number;
  posthog: Pick<PostHogService, 'capture'>;
}) {
  const db = {
    transaction: jest.fn().mockResolvedValue({
      membershipRequest: { id: 'req-1', userId: 'user-1' },
      organizationUnit: {
        id: 'ou-1',
        organizationId: 'org-1',
        name: 'Org',
      },
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValue([{ count: options.membershipCount }]),
        }),
      }),
    }),
  };

  const service = new MembershipService(
    db as never,
    {} as never,
    {} as never,
    { notifyMembershipApproved: jest.fn() } as never,
    {} as never,
    options.posthog as PostHogService,
  );

  return service;
}

describe('MembershipService.approveMembershipRequest PostHog', () => {
  it('captures organization_join when this is the first membership in the org', async () => {
    const capture = jest.fn();
    const service = createService({
      membershipCount: 1,
      posthog: { capture },
    });

    await service.approveMembershipRequest('req-1', 'ou-1', 'reviewer-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.ORGANIZATION_JOIN,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'membership_approve',
      },
    });
  });

  it('does not capture organization_join when the user already has another membership in the org', async () => {
    const capture = jest.fn();
    const service = createService({
      membershipCount: 2,
      posthog: { capture },
    });

    await service.approveMembershipRequest('req-1', 'ou-1', 'reviewer-1');

    expect(capture).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: POSTHOG_EVENT.ORGANIZATION_JOIN }),
    );
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: POSTHOG_EVENT.ORGANIZATION_UNIT_JOIN,
      }),
    );
  });
});

function createRequestOrgJoinService(existingStatus: string) {
  const capture = jest.fn();
  const db = {
    query: {
      memberships: { findFirst: jest.fn().mockResolvedValue(null) },
      organizationUnits: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-1',
          requiredMembershipRequirementProfileId: null,
        }),
      },
      membershipRequests: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'req-1',
          status: existingStatus,
        }),
      },
    },
  };
  const service = new MembershipService(
    db as never,
    {} as never,
    {} as never,
    {} as never,
    { getRequiredFormStatuses: jest.fn().mockResolvedValue([]) } as never,
    { capture } as unknown as PostHogService,
  );
  return { service, capture };
}

describe('MembershipService.requestOrgJoin PostHog', () => {
  it('captures membership_request_reject when a rejected user retries join', async () => {
    const { service, capture } = createRequestOrgJoinService('REJECTED');

    await service.requestOrgJoin('user-1', 'ou-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_REJECT,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        membership_request_id: 'req-1',
        source: 'self_join',
      },
    });
  });

  it('does not capture membership_request_reject when a cancelled user retries join', async () => {
    const { service, capture } = createRequestOrgJoinService('CANCELLED');

    const result = await service.requestOrgJoin('user-1', 'ou-1');

    expect(result.status).toBe('REJECTED');
    expect(capture).not.toHaveBeenCalled();
  });
});
