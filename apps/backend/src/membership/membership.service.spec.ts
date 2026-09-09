jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { ForbiddenGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
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
    { shareSatisfiedRequiredForms: async () => {} } as never,
    options.posthog as PostHogService,
    {} as never,
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

  it('records check_in as the approve source for door approval', async () => {
    const capture = jest.fn();
    const service = createService({
      membershipCount: 1,
      posthog: { capture },
    });

    await service.approveMembershipRequest(
      'req-1',
      'ou-1',
      'reviewer-1',
      'check_in',
    );

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_APPROVE,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        membership_request_id: 'req-1',
        source: 'check_in',
      },
    });
  });
});

describe('MembershipService.removeMembership PostHog', () => {
  it('captures organization_unit_leave with admin source', async () => {
    const capture = jest.fn();
    const db = {
      transaction: jest.fn().mockResolvedValue({
        row: { id: 'mem-1', organizationUnitId: 'ou-1' },
        identity: { userId: 'user-1', organizationUnitId: 'ou-1' },
      }),
      query: {
        organizationUnits: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'ou-1',
            organizationId: 'org-1',
          }),
        },
      },
    };
    const service = new MembershipService(
      db as never,
      {} as never,
      {} as never,
      { notifyMembershipRemoved: jest.fn() } as never,
      {} as never,
      {} as never,
      { capture } as unknown as PostHogService,
    );

    await service.removeMembership('mem-1', 'ou-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.ORGANIZATION_UNIT_LEAVE,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        membership_id: 'mem-1',
        source: 'admin',
      },
    });
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
    { shareSubmissionsWithOrgUnit: async () => {} } as never,
    { capture } as unknown as PostHogService,
    {} as never,
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

function createIdVerificationService(options: {
  membership: {
    id: string;
    userId: string;
    organizationUnitId: string;
  } | null;
  ancestorUnitIds: string[];
}) {
  const returning = jest.fn().mockResolvedValue(
    options.membership
      ? [
          {
            ...options.membership,
            idVerifiedAt: new Date('2026-09-09T10:00:00Z'),
            idVerifiedById: 'actor-1',
          },
        ]
      : [],
  );
  const where = jest.fn().mockReturnValue({ returning });
  const set = jest.fn().mockReturnValue({ where });
  const db = {
    query: {
      memberships: {
        findFirst: jest.fn().mockResolvedValue(options.membership),
      },
    },
    update: jest.fn().mockReturnValue({ set }),
  };
  const organizationUnitDataService = {
    listInclusiveAncestorUnitIds: jest
      .fn()
      .mockResolvedValue(options.ancestorUnitIds),
  };
  const service = new MembershipService(
    db as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    organizationUnitDataService as never,
  );
  return { service, set };
}

describe('MembershipService.setMembershipIdVerified', () => {
  it('sets idVerifiedAt and idVerifiedById when verified is true', async () => {
    const { service, set } = createIdVerificationService({
      membership: { id: 'm-1', userId: 'user-1', organizationUnitId: 'ou-1' },
      ancestorUnitIds: ['ou-1'],
    });

    await service.setMembershipIdVerified('m-1', 'ou-1', true, 'actor-1');

    expect(set).toHaveBeenCalledWith({
      idVerifiedAt: expect.any(Date),
      idVerifiedById: 'actor-1',
    });
  });

  it('clears both columns when verified is false', async () => {
    const { service, set } = createIdVerificationService({
      membership: { id: 'm-1', userId: 'user-1', organizationUnitId: 'ou-1' },
      ancestorUnitIds: ['ou-1'],
    });

    await service.setMembershipIdVerified('m-1', 'ou-1', false, 'actor-1');

    expect(set).toHaveBeenCalledWith({
      idVerifiedAt: null,
      idVerifiedById: null,
    });
  });

  it('throws NotFoundGraphQLError for an unknown membership', async () => {
    const { service } = createIdVerificationService({
      membership: null,
      ancestorUnitIds: ['ou-1'],
    });

    await expect(
      service.setMembershipIdVerified('m-x', 'ou-1', true, 'actor-1'),
    ).rejects.toBeInstanceOf(NotFoundGraphQLError);
  });

  it('throws ForbiddenGraphQLError when the membership unit is outside the caller unit ancestor chain', async () => {
    const { service } = createIdVerificationService({
      membership: { id: 'm-1', userId: 'user-1', organizationUnitId: 'ou-2' },
      ancestorUnitIds: ['ou-1'],
    });

    await expect(
      service.setMembershipIdVerified('m-1', 'ou-1', true, 'actor-1'),
    ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
  });

  it('accepts a membership on an ancestor unit of the caller unit', async () => {
    const { service, set } = createIdVerificationService({
      membership: {
        id: 'm-1',
        userId: 'user-1',
        organizationUnitId: 'ou-parent',
      },
      ancestorUnitIds: ['ou-child', 'ou-parent'],
    });

    await service.setMembershipIdVerified('m-1', 'ou-child', true, 'actor-1');

    expect(set).toHaveBeenCalled();
  });
});
