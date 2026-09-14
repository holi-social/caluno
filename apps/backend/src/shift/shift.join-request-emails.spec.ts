jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { ShiftInviteStatus } from './enums';
import { ShiftService } from './shift.service';

function createShiftService(options: {
  inviteStatus: ShiftInviteStatus;
  notifyShiftInstanceJoined?: jest.Mock;
  notifyShiftInstanceJoinApproved?: jest.Mock;
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
            maxVolunteers: null,
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
