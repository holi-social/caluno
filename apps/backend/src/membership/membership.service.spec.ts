jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { PostHogCaptureService } from '../shared/observability/posthog.capture.service';
import { MembershipService } from './membership.service';

function createService(options: {
  membershipCount: number;
  posthog: Pick<PostHogCaptureService, 'captureUserJoinedOrg'>;
}) {
  const db = {
    transaction: jest.fn().mockResolvedValue({
      membershipRequest: { userId: 'user-1' },
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
    options.posthog as PostHogCaptureService,
  );

  return service;
}

describe('MembershipService.approveMembershipRequest PostHog', () => {
  it('captures user_joined_org when this is the first membership in the org', async () => {
    const captureUserJoinedOrg = jest.fn();
    const service = createService({
      membershipCount: 1,
      posthog: { captureUserJoinedOrg },
    });

    await service.approveMembershipRequest('req-1', 'ou-1', 'reviewer-1');

    expect(captureUserJoinedOrg).toHaveBeenCalledWith('user-1', {
      organizationId: 'org-1',
      organizationUnitId: 'ou-1',
      source: 'membership_approved',
    });
  });

  it('does not capture user_joined_org when the user already has another membership in the org', async () => {
    const captureUserJoinedOrg = jest.fn();
    const service = createService({
      membershipCount: 2,
      posthog: { captureUserJoinedOrg },
    });

    await service.approveMembershipRequest('req-1', 'ou-1', 'reviewer-1');

    expect(captureUserJoinedOrg).not.toHaveBeenCalled();
  });
});
