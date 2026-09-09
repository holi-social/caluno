jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import {
  POSTHOG_EVENT,
  POSTHOG_JOIN_SOURCE,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { ShiftInviteStatus } from './enums';
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
