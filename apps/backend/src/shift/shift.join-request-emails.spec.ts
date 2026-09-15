jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { ShiftInviteStatus, ShiftVisibility } from './enums';
import { ShiftService } from './shift.service';

function createShiftService(options: {
  inviteStatus: ShiftInviteStatus;
  maxVolunteers?: number | null;
  currentParticipantCount?: number;
  notifyShiftInstanceJoined?: jest.Mock;
  notifyShiftInstanceJoinApproved?: jest.Mock;
  notifyShiftInstanceWaitlistJoined?: jest.Mock;
  notifyShiftInstanceInvited?: jest.Mock;
}) {
  const db = {
    query: {
      shiftInstances: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'instance-1',
          overrideMaxVolunteers: null,
          actualStartsAt: new Date('2026-08-01T09:00:00.000Z'),
          actualEndsAt: new Date('2026-08-01T12:00:00.000Z'),
          master: {
            id: 'shift-1',
            organizationUnitId: 'ou-1',
            title: 'Evening shift',
            location: 'Hall',
            instructions: null,
            maxVolunteers: options.maxVolunteers ?? null,
          },
        }),
      },
      shiftInstanceInvites: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'invite-1',
          instanceId: 'instance-1',
          userId: 'volunteer-1',
          status: options.inviteStatus,
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
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest
          .fn()
          .mockResolvedValue([
            { current: options.currentParticipantCount ?? 0 },
          ]),
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
            },
          ]),
        }),
      }),
    }),
  };

  return new ShiftService(
    db as never,
    { findUsersWithPermission: jest.fn().mockResolvedValue([]) } as never,
    {} as never,
    {} as never,
    {
      notifyShiftInstanceJoined: options.notifyShiftInstanceJoined ?? jest.fn(),
      notifyShiftInstanceJoinApproved:
        options.notifyShiftInstanceJoinApproved ?? jest.fn(),
      notifyShiftInstanceWaitlistJoined:
        options.notifyShiftInstanceWaitlistJoined ?? jest.fn(),
      notifyShiftInstanceInvited:
        options.notifyShiftInstanceInvited ?? jest.fn(),
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { capture: jest.fn() } as never,
    {} as never,
  );
}

describe('ShiftService.updateShiftInstanceInviteStatus emails', () => {
  it('emails the volunteer when an admin approves a pending join request', async () => {
    const notifyShiftInstanceJoinApproved = jest.fn();
    const service = createShiftService({
      inviteStatus: ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
      notifyShiftInstanceJoinApproved,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.JOINED,
      'admin-1',
    );

    expect(notifyShiftInstanceJoinApproved).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'volunteer-1',
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    );
  });

  it('emails the volunteer a waitlist notice when an admin approval loses the race for the last seat', async () => {
    const notifyShiftInstanceJoinApproved = jest.fn();
    const notifyShiftInstanceWaitlistJoined = jest.fn();
    const service = createShiftService({
      inviteStatus: ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
      maxVolunteers: 1,
      currentParticipantCount: 1,
      notifyShiftInstanceJoinApproved,
      notifyShiftInstanceWaitlistJoined,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.JOINED,
      'admin-1',
    );

    expect(notifyShiftInstanceJoinApproved).not.toHaveBeenCalled();
    expect(notifyShiftInstanceWaitlistJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'volunteer-1',
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    );
  });

  it('emails the volunteer a waitlist notice when accepting an admin invite to an already-full shift', async () => {
    const notifyShiftInstanceJoined = jest.fn();
    const notifyShiftInstanceWaitlistJoined = jest.fn();
    const service = createShiftService({
      inviteStatus: ShiftInviteStatus.ADMIN_INVITED,
      maxVolunteers: 1,
      currentParticipantCount: 1,
      notifyShiftInstanceJoined,
      notifyShiftInstanceWaitlistJoined,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.JOINED,
      'volunteer-1',
    );

    expect(notifyShiftInstanceJoined).not.toHaveBeenCalled();
    expect(notifyShiftInstanceWaitlistJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'volunteer-1',
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    );
  });

  it('does not send a join-approved email when a volunteer self-accepts an invite', async () => {
    const notifyShiftInstanceJoinApproved = jest.fn();
    const service = createShiftService({
      inviteStatus: ShiftInviteStatus.ADMIN_INVITED,
      notifyShiftInstanceJoinApproved,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.JOINED,
      'volunteer-1',
    );

    expect(notifyShiftInstanceJoinApproved).not.toHaveBeenCalled();
  });

  it('emails the volunteer a re-invite when an admin re-invites after a rejection', async () => {
    const notifyShiftInstanceInvited = jest.fn();
    const service = createShiftService({
      inviteStatus: ShiftInviteStatus.ADMIN_REJECTED,
      notifyShiftInstanceInvited,
    });

    await service.updateShiftInstanceInviteStatus(
      'volunteer-1',
      'instance-1',
      ShiftInviteStatus.ADMIN_INVITED,
      'admin-1',
    );

    expect(notifyShiftInstanceInvited).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserIds: ['volunteer-1'],
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    );
  });
});

function createJoinRequestService(options: {
  notifyShiftInstanceJoinRequested?: jest.Mock;
  notifyShiftInstanceJoined?: jest.Mock;
  notifyShiftInstanceWaitlistJoined?: jest.Mock;
  findUsersWithPermission?: jest.Mock;
  joinRequiresApproval?: boolean;
  maxVolunteers?: number | null;
  currentParticipantCount?: number;
  existingInvite?: { status: ShiftInviteStatus };
}) {
  const db = {
    query: {
      shiftInstances: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'instance-1',
          isCancelled: false,
          overrideMaxVolunteers: null,
          actualStartsAt: new Date('2026-08-01T09:00:00.000Z'),
          actualEndsAt: new Date('2026-08-01T12:00:00.000Z'),
          master: {
            id: 'shift-1',
            organizationUnitId: 'ou-1',
            title: 'Evening shift',
            location: 'Hall',
            isDeleted: false,
            visibility: ShiftVisibility.ALL_MEMBERS,
            joinRequiresApproval: options.joinRequiresApproval ?? true,
            maxVolunteers: options.maxVolunteers ?? null,
          },
        }),
      },
      shiftInstanceInvites: {
        findFirst: jest.fn().mockResolvedValue(
          options.existingInvite
            ? {
                id: 'invite-1',
                instanceId: 'instance-1',
                userId: 'volunteer-1',
                status: options.existingInvite.status,
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
          .mockResolvedValue([
            { current: options.currentParticipantCount ?? 0 },
          ]),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
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
            },
          ]),
        }),
      }),
    }),
  };

  return new ShiftService(
    db as never,
    {
      findUsersWithPermission:
        options.findUsersWithPermission ?? jest.fn().mockResolvedValue([]),
    } as never,
    {} as never,
    { isMemberOfUnitOrAncestor: jest.fn().mockResolvedValue(true) } as never,
    {
      notifyShiftInstanceJoinRequested:
        options.notifyShiftInstanceJoinRequested ?? jest.fn(),
      notifyShiftInstanceJoined: options.notifyShiftInstanceJoined ?? jest.fn(),
      notifyShiftInstanceWaitlistJoined:
        options.notifyShiftInstanceWaitlistJoined ?? jest.fn(),
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { capture: jest.fn() } as never,
    {} as never,
  );
}

describe('ShiftService.joinShiftInstance emails', () => {
  it('emails shift managers when a join request needs admin approval', async () => {
    const notifyShiftInstanceJoinRequested = jest.fn();
    const findUsersWithPermission = jest
      .fn()
      .mockResolvedValue([{ id: 'manager-1' }]);
    const service = createJoinRequestService({
      notifyShiftInstanceJoinRequested,
      findUsersWithPermission,
    });

    await service.joinShiftInstance('volunteer-1', 'instance-1', {
      formsAlreadySatisfied: true,
    });
    // notifyShiftInstanceJoinRequested is fired without awaiting it, so let
    // its pending microtasks (organizationUnits lookup, permission lookup)
    // settle before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notifyShiftInstanceJoinRequested).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterUserId: 'volunteer-1',
        recipientUserIds: ['manager-1'],
        shiftId: 'shift-1',
        shiftTitle: 'Evening shift',
        instanceId: 'instance-1',
      }),
    );
  });

  it('emails a new volunteer a waitlist notice when the shift is already full', async () => {
    const notifyShiftInstanceJoined = jest.fn();
    const notifyShiftInstanceWaitlistJoined = jest.fn();
    const service = createJoinRequestService({
      joinRequiresApproval: false,
      maxVolunteers: 1,
      currentParticipantCount: 1,
      notifyShiftInstanceJoined,
      notifyShiftInstanceWaitlistJoined,
    });

    await service.joinShiftInstance('volunteer-1', 'instance-1', {
      formsAlreadySatisfied: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notifyShiftInstanceJoined).not.toHaveBeenCalled();
    expect(notifyShiftInstanceWaitlistJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'volunteer-1',
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    );
  });

  it('emails a re-joining volunteer a waitlist notice when the shift is already full', async () => {
    const notifyShiftInstanceJoined = jest.fn();
    const notifyShiftInstanceWaitlistJoined = jest.fn();
    const service = createJoinRequestService({
      existingInvite: { status: ShiftInviteStatus.VOLUNTEER_CANCELLED },
      maxVolunteers: 1,
      currentParticipantCount: 1,
      notifyShiftInstanceJoined,
      notifyShiftInstanceWaitlistJoined,
    });

    await service.joinShiftInstance('volunteer-1', 'instance-1', {
      formsAlreadySatisfied: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notifyShiftInstanceJoined).not.toHaveBeenCalled();
    expect(notifyShiftInstanceWaitlistJoined).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'volunteer-1',
        shiftId: 'shift-1',
        instanceId: 'instance-1',
      }),
    );
  });
});
