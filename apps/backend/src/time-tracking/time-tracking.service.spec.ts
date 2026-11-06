jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { AddTimeEntryInput } from './inputs/add-time-entry.input';
import { TimeTrackingService } from './time-tracking.service';

describe('TimeTrackingService.addTimeEntry PostHog', () => {
  it('captures with the volunteer as subject, not the admin actor', async () => {
    const capture = jest.fn();
    const db = {
      query: {
        shiftInstances: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'si-1',
            master: { organizationUnitId: 'ou-1' },
          }),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'te-1',
              shiftInstanceId: 'si-1',
              volunteerId: 'volunteer-1',
            },
          ]),
        }),
      }),
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      { hasOpenTimeEntry: jest.fn().mockResolvedValue(false) } as never,
      { capture } as unknown as PostHogService,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const input = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: 'si-1',
      volunteerId: 'volunteer-1',
      startedAt: new Date(),
      notes: null,
    });

    await service.addTimeEntry('ou-1', input, 'admin-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.TIME_ENTRY_CREATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_unit_id: 'ou-1',
        shift_instance_id: 'si-1',
      },
    });
  });
});

describe('TimeTrackingService.inviteVolunteerToOrganization PostHog', () => {
  it('captures organization_unit_invite for the volunteer after the email is queued', async () => {
    const capture = jest.fn();
    const notifyOrganizationUnitInvited = jest.fn();
    const db = {
      query: {
        organizationUnits: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'ou-1',
            name: 'Unit',
            organizationId: 'org-1',
          }),
        },
      },
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      {} as never,
      { capture } as unknown as PostHogService,
      {} as never,
      { findById: jest.fn().mockResolvedValue({ id: 'volunteer-1' }) } as never,
      { notifyOrganizationUnitInvited } as never,
      {} as never,
    );

    await service.inviteVolunteerToOrganization('ou-1', 'volunteer-1');

    expect(notifyOrganizationUnitInvited).toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.ORGANIZATION_UNIT_INVITE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'check_in',
      },
    });
  });
});

describe('TimeTrackingService.getCheckInReadiness without a shift', () => {
  const membershipService = () => ({
    isMemberOfUnitOrAncestor: jest.fn().mockResolvedValue(true),
    findPendingMembershipRequest: jest.fn().mockResolvedValue({ id: 'mr-1' }),
    findMembershipInUnits: jest.fn().mockResolvedValue(null),
  });
  const shiftService = () => ({
    findInstanceById: jest.fn().mockResolvedValue({ id: 'si-1' }),
    findInviteStatusesForUser: jest.fn(),
    hasOpenTimeEntry: jest.fn(),
  });
  const organizationUnitDataService = () => ({
    listInclusiveAncestorUnitIds: jest.fn().mockResolvedValue(['ou-1']),
    findById: jest.fn().mockResolvedValue({ idVerificationEnabled: false }),
  });

  it('reports the membership facts and skips the shift lookups', async () => {
    const shift = shiftService();
    const service = new TimeTrackingService(
      {} as never,
      membershipService() as never,
      shift as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      organizationUnitDataService() as never,
    );

    const readiness = await service.getCheckInReadiness(
      'volunteer-1',
      null,
      'ou-1',
    );

    expect(readiness).toEqual({
      isMember: true,
      openMembershipRequestId: 'mr-1',
      shiftInviteStatus: null,
      isParticipating: false,
      hasOpenTimeEntry: false,
      idVerificationEnabled: false,
      idVerified: false,
      membershipId: null,
    });
    expect(shift.findInstanceById).not.toHaveBeenCalled();
    expect(shift.findInviteStatusesForUser).not.toHaveBeenCalled();
    expect(shift.hasOpenTimeEntry).not.toHaveBeenCalled();
  });

  it('still queries the shift facts when an instance is given', async () => {
    const shift = shiftService();
    shift.findInviteStatusesForUser.mockResolvedValue([]);
    shift.hasOpenTimeEntry.mockResolvedValue(true);
    const service = new TimeTrackingService(
      {} as never,
      membershipService() as never,
      shift as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      organizationUnitDataService() as never,
    );

    await service.getCheckInReadiness('volunteer-1', 'si-1', 'ou-1');

    expect(shift.findInstanceById).toHaveBeenCalledWith('si-1', 'ou-1');
    expect(shift.findInviteStatusesForUser).toHaveBeenCalledWith(
      'volunteer-1',
      ['si-1'],
    );
    expect(shift.hasOpenTimeEntry).toHaveBeenCalledWith('si-1', 'volunteer-1');
  });
});
