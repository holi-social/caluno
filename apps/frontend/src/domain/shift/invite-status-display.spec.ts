import { describe, expect, it } from 'bun:test';
import { EventInviteStatus, ShiftInviteStatus } from '@repo/data';
import {
  adminChipTargetStatuses,
  adminReinviteTargetStatus,
  adminRowActions,
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  partitionInvitesByWaitlist,
  preselectedInviteMemberIds,
  toInviteDisplayState,
} from './invite-status-display';

describe('canAdminUninvite', () => {
  it('returns true for active roster statuses', () => {
    expect(canAdminUninvite(ShiftInviteStatus.AdminInvited)).toBe(true);
    expect(canAdminUninvite(ShiftInviteStatus.AwaitingAdminApproval)).toBe(
      true,
    );
    expect(canAdminUninvite(ShiftInviteStatus.WaitlistJoined)).toBe(true);
    expect(canAdminUninvite(ShiftInviteStatus.Joined)).toBe(true);
    expect(canAdminUninvite(ShiftInviteStatus.VolunteerRejected)).toBe(false);
    expect(canAdminUninvite(ShiftInviteStatus.VolunteerCancelled)).toBe(false);
    expect(canAdminUninvite(ShiftInviteStatus.AdminRejected)).toBe(false);
  });

  it('works for event invite statuses the same way', () => {
    expect(canAdminUninvite(EventInviteStatus.AdminInvited)).toBe(true);
    expect(canAdminUninvite(EventInviteStatus.Joined)).toBe(true);
    expect(canAdminUninvite(EventInviteStatus.AdminRejected)).toBe(false);
  });
});

describe('partitionInvitesByWaitlist', () => {
  it('separates waitlisted invites from the rest, preserving order', () => {
    const invites = [
      { id: '1', status: ShiftInviteStatus.AdminInvited },
      { id: '2', status: ShiftInviteStatus.WaitlistJoined },
      { id: '3', status: ShiftInviteStatus.Joined },
      { id: '4', status: ShiftInviteStatus.WaitlistJoined },
    ];
    expect(partitionInvitesByWaitlist(invites)).toEqual({
      invites: [
        { id: '1', status: ShiftInviteStatus.AdminInvited },
        { id: '3', status: ShiftInviteStatus.Joined },
      ],
      waitlisted: [
        { id: '2', status: ShiftInviteStatus.WaitlistJoined },
        { id: '4', status: ShiftInviteStatus.WaitlistJoined },
      ],
    });
  });

  it('returns an empty waitlist when nobody is waitlisted', () => {
    const invites = [{ id: '1', status: ShiftInviteStatus.Joined }];
    expect(partitionInvitesByWaitlist(invites)).toEqual({
      invites,
      waitlisted: [],
    });
  });
});

describe('adminUninviteTargetStatus', () => {
  it('returns ADMIN_REJECTED for uninvitable statuses', () => {
    expect(adminUninviteTargetStatus(ShiftInviteStatus.AdminInvited)).toBe(
      ShiftInviteStatus.AdminRejected,
    );
    expect(adminUninviteTargetStatus(ShiftInviteStatus.Joined)).toBe(
      ShiftInviteStatus.AdminRejected,
    );
  });

  it('returns null for statuses that cannot be uninvited', () => {
    expect(
      adminUninviteTargetStatus(ShiftInviteStatus.VolunteerRejected),
    ).toBeNull();
    expect(
      adminUninviteTargetStatus(ShiftInviteStatus.VolunteerCancelled),
    ).toBeNull();
    expect(
      adminUninviteTargetStatus(ShiftInviteStatus.AdminRejected),
    ).toBeNull();
  });

  it('returns ADMIN_REJECTED for event invite statuses too', () => {
    expect(adminUninviteTargetStatus(EventInviteStatus.AdminInvited)).toBe(
      EventInviteStatus.AdminRejected,
    );
  });
});

describe('canAdminReinvite', () => {
  it('returns true only for ADMIN_REJECTED', () => {
    expect(canAdminReinvite(ShiftInviteStatus.AdminRejected)).toBe(true);
    expect(canAdminReinvite(ShiftInviteStatus.AdminInvited)).toBe(false);
    expect(canAdminReinvite(ShiftInviteStatus.Joined)).toBe(false);
  });
});

describe('adminReinviteTargetStatus', () => {
  it('returns ADMIN_INVITED for ADMIN_REJECTED', () => {
    expect(adminReinviteTargetStatus(ShiftInviteStatus.AdminRejected)).toBe(
      ShiftInviteStatus.AdminInvited,
    );
  });

  it('returns null for other statuses', () => {
    expect(
      adminReinviteTargetStatus(ShiftInviteStatus.AdminInvited),
    ).toBeNull();
    expect(adminReinviteTargetStatus(ShiftInviteStatus.Joined)).toBeNull();
  });

  it('returns ADMIN_INVITED for event invite statuses too', () => {
    expect(adminReinviteTargetStatus(EventInviteStatus.AdminRejected)).toBe(
      EventInviteStatus.AdminInvited,
    );
  });
});

describe('preselectedInviteMemberIds', () => {
  it('excludes ADMIN_REJECTED so invite sheets do not silently re-invite', () => {
    expect(
      preselectedInviteMemberIds([
        { id: 'a', inviteStatus: EventInviteStatus.AdminInvited },
        { id: 'b', inviteStatus: EventInviteStatus.Joined },
        { id: 'c', inviteStatus: EventInviteStatus.AdminRejected },
        { id: 'd', inviteStatus: null },
      ]),
    ).toEqual(['a', 'b', 'd']);
  });
});

describe('toInviteDisplayState', () => {
  it('maps each domain status to a display state', () => {
    expect(toInviteDisplayState(ShiftInviteStatus.AdminInvited)).toBe(
      'invited',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.AwaitingAdminApproval)).toBe(
      'requested',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.WaitlistJoined)).toBe(
      'waitlisted',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.Joined)).toBe('accepted');
    expect(toInviteDisplayState(ShiftInviteStatus.VolunteerRejected)).toBe(
      'declined',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.VolunteerCancelled)).toBe(
      'cancelled',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.AdminRejected)).toBe(
      'rejected',
    );
  });
});

describe('countInviteDisplayStates', () => {
  it('counts invite statuses for the summary line', () => {
    expect(
      countInviteDisplayStates([
        ShiftInviteStatus.AdminInvited,
        ShiftInviteStatus.AdminInvited,
        ShiftInviteStatus.Joined,
        ShiftInviteStatus.Joined,
        ShiftInviteStatus.AdminRejected,
      ]),
    ).toEqual({
      invited: 2,
      accepted: 2,
      signedUp: 0,
      declined: 0,
      cancelled: 0,
      rejected: 1,
      waitlisted: 0,
    });
  });

  it('counts waitlisted separately from invited', () => {
    expect(
      countInviteDisplayStates([
        ShiftInviteStatus.AdminInvited,
        ShiftInviteStatus.WaitlistJoined,
        ShiftInviteStatus.WaitlistJoined,
      ]),
    ).toEqual({
      invited: 1,
      accepted: 0,
      signedUp: 0,
      declined: 0,
      cancelled: 0,
      rejected: 0,
      waitlisted: 2,
    });
  });

  it('still counts approval requests under invited', () => {
    expect(
      countInviteDisplayStates([
        ShiftInviteStatus.AwaitingAdminApproval,
        ShiftInviteStatus.AwaitingAdminApproval,
      ]),
    ).toEqual({
      invited: 2,
      accepted: 0,
      signedUp: 0,
      declined: 0,
      cancelled: 0,
      rejected: 0,
      waitlisted: 0,
    });
  });
});

describe('formatInviteStatusSummary', () => {
  it('formats counts and spots', () => {
    expect(
      formatInviteStatusSummary(
        {
          invited: 4,
          accepted: 2,
          signedUp: 1,
          declined: 0,
          cancelled: 0,
          rejected: 0,
          waitlisted: 0,
        },
        12,
        {
          invited: 'invited',
          accepted: 'accepted',
          signedUp: 'signed up',
          waitlisted: 'waitlisted',
          spots: 'spots',
        },
      ),
    ).toBe('4 invited · 2 accepted · 1 signed up · 12 spots');
  });

  it('appends the waitlisted count when present', () => {
    expect(
      formatInviteStatusSummary(
        {
          invited: 4,
          accepted: 2,
          signedUp: 1,
          declined: 0,
          cancelled: 0,
          rejected: 0,
          waitlisted: 3,
        },
        12,
        {
          invited: 'invited',
          accepted: 'accepted',
          signedUp: 'signed up',
          waitlisted: 'waitlisted',
          spots: 'spots',
        },
      ),
    ).toBe('4 invited · 2 accepted · 1 signed up · 3 waitlisted · 12 spots');
  });
});

describe('adminRowActions', () => {
  it('scopes row buttons to the volunteer status (VOLI-1257)', () => {
    expect(adminRowActions(ShiftInviteStatus.AwaitingAdminApproval)).toEqual([
      'Approve',
    ]);
    expect(adminRowActions(ShiftInviteStatus.AdminRejected)).toEqual([
      'Invite',
    ]);
  });

  it('gives every other status no admin row buttons', () => {
    expect(adminRowActions(ShiftInviteStatus.AdminInvited)).toEqual([]);
    expect(adminRowActions(ShiftInviteStatus.Joined)).toEqual([]);
    expect(adminRowActions(ShiftInviteStatus.WaitlistJoined)).toEqual([]);
    expect(adminRowActions(ShiftInviteStatus.VolunteerRejected)).toEqual([]);
    expect(adminRowActions(ShiftInviteStatus.VolunteerCancelled)).toEqual([]);
  });
});

describe('adminChipTargetStatuses', () => {
  it('offers only rejected from invited', () => {
    expect(adminChipTargetStatuses(ShiftInviteStatus.AdminInvited)).toEqual([
      ShiftInviteStatus.AdminRejected,
    ]);
  });

  it('offers joined and rejected from pending approval', () => {
    expect(
      adminChipTargetStatuses(ShiftInviteStatus.AwaitingAdminApproval),
    ).toEqual([ShiftInviteStatus.Joined, ShiftInviteStatus.AdminRejected]);
  });

  it('offers only rejected from joined and invite-back from rejected', () => {
    expect(adminChipTargetStatuses(ShiftInviteStatus.Joined)).toEqual([
      ShiftInviteStatus.AdminRejected,
    ]);
    expect(adminChipTargetStatuses(ShiftInviteStatus.AdminRejected)).toEqual([
      ShiftInviteStatus.AdminInvited,
    ]);
  });

  it('keeps waitlisted targets to joined and rejected', () => {
    expect(adminChipTargetStatuses(ShiftInviteStatus.WaitlistJoined)).toEqual([
      ShiftInviteStatus.Joined,
      ShiftInviteStatus.AdminRejected,
    ]);
  });

  it('renders volunteer-declined and cancelled rows as plain badges', () => {
    expect(
      adminChipTargetStatuses(ShiftInviteStatus.VolunteerRejected),
    ).toEqual([]);
    expect(
      adminChipTargetStatuses(ShiftInviteStatus.VolunteerCancelled),
    ).toEqual([]);
  });
});
