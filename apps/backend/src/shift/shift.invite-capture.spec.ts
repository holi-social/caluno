jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import {
  POSTHOG_EVENT,
  POSTHOG_JOIN_SOURCE,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { ShiftInviteStatus, ShiftVisibility } from './enums';
import { ShiftService } from './shift.service';

function createInviteService(options: {
  existingStatus?: ShiftInviteStatus;
  capture: jest.Mock;
}) {
  const db = {
    query: {
      shiftInstances: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'si-1',
          invites: options.existingStatus
            ? [{ userId: 'volunteer-1', status: options.existingStatus }]
            : [],
          master: {
            id: 'shift-1',
            organizationUnitId: 'ou-1',
            title: 'Evening shift',
            location: 'Hall',
            instructions: null,
          },
        }),
      },
      organizationUnits: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ou-1',
          name: 'Unit',
          organizationId: 'org-1',
        }),
      },
    },
    transaction: jest
      .fn()
      .mockImplementation(async (fn: (tx: object) => unknown) =>
        fn({
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(undefined),
            }),
          }),
        }),
      ),
  };

  return new ShiftService(
    db as never,
    {} as never,
    {} as never,
    { isMemberOfUnitOrAncestor: jest.fn().mockResolvedValue(true) } as never,
    {
      notifyShiftInstanceInvited: jest.fn(),
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { capture: options.capture } as unknown as PostHogService,
    {} as never,
  );
}

describe('ShiftService.inviteVolunteerToShiftInstance PostHog', () => {
  it('captures shift_instance_invite with check_in source for a new door invite', async () => {
    const capture = jest.fn();
    const service = createInviteService({ capture });

    await service.inviteVolunteerToShiftInstance('si-1', 'volunteer-1', 'ou-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        shift_id: 'shift-1',
        shift_instance_id: 'si-1',
        source: POSTHOG_JOIN_SOURCE.CHECK_IN,
      },
    });
  });

  it('does not capture when the volunteer already has an active invite', async () => {
    const capture = jest.fn();
    const service = createInviteService({
      capture,
      existingStatus: ShiftInviteStatus.ADMIN_INVITED,
    });

    await service.inviteVolunteerToShiftInstance('si-1', 'volunteer-1', 'ou-1');

    expect(capture).not.toHaveBeenCalled();
  });
});

async function flushMicrotasks(): Promise<void> {
  // Matches the settle pattern in shift.join-request-emails.spec.ts; the
  // backend tsconfig lib predates Promise.withResolvers (TS2550).
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function createWaitlistService(options: {
  existingInviteStatus?: ShiftInviteStatus;
  masterMaxVolunteers?: number | null;
  joinedCount?: number;
  joinRequiresApproval?: boolean;
  capture: jest.Mock;
}) {
  const db = {
    query: {
      shiftInstances: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'instance-1',
          isCancelled: false,
          overrideMaxVolunteers: null,
          actualStartsAt: new Date('2026-10-01T09:00:00.000Z'),
          actualEndsAt: new Date('2026-10-01T12:00:00.000Z'),
          master: {
            id: 'shift-1',
            organizationUnitId: 'ou-1',
            title: 'Evening shift',
            location: 'Hall',
            instructions: null,
            isDeleted: false,
            visibility: ShiftVisibility.ALL_MEMBERS,
            joinRequiresApproval: options.joinRequiresApproval ?? false,
            maxVolunteers: options.masterMaxVolunteers ?? null,
          },
        }),
      },
      shiftInstanceInvites: {
        findFirst: jest.fn().mockResolvedValue(
          options.existingInviteStatus
            ? {
                id: 'invite-1',
                instanceId: 'instance-1',
                userId: 'volunteer-1',
                status: options.existingInviteStatus,
              }
            : undefined,
        ),
      },
      organizationUnits: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ou-1',
          name: 'Unit',
          organizationId: 'org-1',
        }),
      },
    },
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest
          .fn()
          .mockResolvedValue([{ current: options.joinedCount ?? 0 }]),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'invite-1',
              instanceId: 'instance-1',
              userId: 'volunteer-1',
              status: ShiftInviteStatus.WAITLIST_JOINED,
            },
          ]),
        }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'invite-1',
              instanceId: 'instance-1',
              userId: 'volunteer-1',
              status: ShiftInviteStatus.JOINED,
            },
          ]),
        }),
      }),
    }),
  };

  return new ShiftService(
    db as never,
    { findUsersWithPermission: jest.fn().mockResolvedValue([]) } as never,
    { findById: jest.fn().mockResolvedValue(undefined) } as never,
    { isMemberOfUnitOrAncestor: jest.fn().mockResolvedValue(true) } as never,
    {
      notifyShiftInstanceJoined: jest.fn(),
      notifyShiftInstanceJoinRequested: jest.fn(),
      notifyShiftInstanceLeft: jest.fn(),
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { capture: options.capture } as unknown as PostHogService,
    {} as never,
  );
}

describe('ShiftService.joinShiftInstance PostHog', () => {
  it('captures shift_instance_invite_update when a fresh join lands on the waitlist', async () => {
    const capture = jest.fn();
    const service = createWaitlistService({
      capture,
      masterMaxVolunteers: 2,
      joinedCount: 2,
    });

    await service.joinShiftInstance('volunteer-1', 'instance-1', {
      formsAlreadySatisfied: true,
    });

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: POSTHOG_JOIN_SOURCE.SELF_JOIN,
        shift_id: 'shift-1',
        shift_instance_id: 'instance-1',
        invite_status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    });
  });

  it('captures shift_instance_invite_update with previous_status when a re-join lands on the waitlist', async () => {
    const capture = jest.fn();
    const service = createWaitlistService({
      capture,
      existingInviteStatus: ShiftInviteStatus.VOLUNTEER_CANCELLED,
      masterMaxVolunteers: 2,
      joinedCount: 2,
    });

    await service.joinShiftInstance('volunteer-1', 'instance-1', {
      formsAlreadySatisfied: true,
    });

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: POSTHOG_JOIN_SOURCE.SELF_JOIN,
        shift_id: 'shift-1',
        shift_instance_id: 'instance-1',
        invite_status: ShiftInviteStatus.WAITLIST_JOINED,
        previous_status: ShiftInviteStatus.VOLUNTEER_CANCELLED,
      },
    });
  });

  it('captures shift_instance_invite_update when a fresh join requires admin approval', async () => {
    const capture = jest.fn();
    const service = createWaitlistService({
      capture,
      joinRequiresApproval: true,
    });

    await service.joinShiftInstance('volunteer-1', 'instance-1', {
      formsAlreadySatisfied: true,
    });
    // The join-requested notification is fired without awaiting it; let its
    // pending microtasks settle before asserting.
    await flushMicrotasks();

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: POSTHOG_JOIN_SOURCE.SELF_JOIN,
        shift_id: 'shift-1',
        shift_instance_id: 'instance-1',
        invite_status: ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
      },
    });
  });
});

describe('ShiftService.updateShiftInstanceInviteStatus PostHog', () => {
  it('records previous_status when a volunteer claims a freed seat from the waitlist', async () => {
    const capture = jest.fn();
    const service = createWaitlistService({
      capture,
      existingInviteStatus: ShiftInviteStatus.WAITLIST_JOINED,
      masterMaxVolunteers: 2,
      joinedCount: 1,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.JOINED,
    );

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'self',
        shift_id: 'shift-1',
        shift_instance_id: 'instance-1',
        invite_status: ShiftInviteStatus.JOINED,
        previous_status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    });
  });

  it('captures backoffice surface when an admin updates the invite', async () => {
    const capture = jest.fn();
    const service = createWaitlistService({
      capture,
      existingInviteStatus: ShiftInviteStatus.WAITLIST_JOINED,
      masterMaxVolunteers: 2,
      joinedCount: 1,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.JOINED,
      'admin-1',
    );

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: POSTHOG_JOIN_SOURCE.ADMIN,
        shift_id: 'shift-1',
        shift_instance_id: 'instance-1',
        invite_status: ShiftInviteStatus.JOINED,
        previous_status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    });
  });
  it('records previous_status when a volunteer leaves the waitlist', async () => {
    const capture = jest.fn();
    const service = createWaitlistService({
      capture,
      existingInviteStatus: ShiftInviteStatus.WAITLIST_JOINED,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.VOLUNTEER_CANCELLED,
    );
    await flushMicrotasks();

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'self',
        shift_id: 'shift-1',
        shift_instance_id: 'instance-1',
        invite_status: ShiftInviteStatus.VOLUNTEER_CANCELLED,
        previous_status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    });
  });
});

function createSeriesClaimService(options: { capture: jest.Mock }) {
  const db = {
    query: {
      shifts: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'shift-1',
          organizationUnitId: 'ou-1',
          maxVolunteers: 2,
          isDeleted: false,
        }),
      },
      shiftInvites: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'invite-1',
          shiftId: 'shift-1',
          userId: 'volunteer-1',
          status: ShiftInviteStatus.WAITLIST_JOINED,
        }),
      },
      shiftInstances: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'instance-1',
          overrideMaxVolunteers: null,
        }),
      },
      shiftInstanceInvites: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      organizationUnits: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-1',
        }),
      },
    },
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ current: 1 }]),
      }),
    }),
    transaction: jest
      .fn()
      .mockImplementation(async (fn: (tx: object) => unknown) =>
        fn({
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([
                  {
                    id: 'invite-1',
                    shiftId: 'shift-1',
                    userId: 'volunteer-1',
                    status: ShiftInviteStatus.JOINED,
                  },
                ]),
              }),
            }),
          }),
          query: {
            shiftInstances: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        }),
      ),
  };

  return new ShiftService(
    db as never,
    { findUsersWithPermission: jest.fn().mockResolvedValue([]) } as never,
    { findById: jest.fn().mockResolvedValue(undefined) } as never,
    { isMemberOfUnitOrAncestor: jest.fn().mockResolvedValue(true) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { capture: options.capture } as unknown as PostHogService,
    {} as never,
  );
}

describe('ShiftService.updateShiftInviteStatus PostHog', () => {
  it('records previous_status when a volunteer claims a series invite from the waitlist', async () => {
    const capture = jest.fn();
    const service = createSeriesClaimService({ capture });

    await service.updateShiftInviteStatus(
      'volunteer-1',
      'shift-1',
      ShiftInviteStatus.JOINED,
    );

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'self',
        shift_id: 'shift-1',
        invite_status: ShiftInviteStatus.JOINED,
        previous_status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    });
  });

  it('tags the series waitlist claim join with waitlist_promote source', async () => {
    const capture = jest.fn();
    const service = createSeriesClaimService({ capture });

    await service.updateShiftInviteStatus(
      'volunteer-1',
      'shift-1',
      ShiftInviteStatus.JOINED,
    );

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_JOIN,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: POSTHOG_JOIN_SOURCE.WAITLIST_PROMOTE,
        shift_id: 'shift-1',
      },
    });
  });
});
