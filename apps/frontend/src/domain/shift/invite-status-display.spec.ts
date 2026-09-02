import { describe, expect, it } from 'bun:test';
import { EventInviteStatus, ShiftInviteStatus } from '@repo/data';
import {
  adminReinviteTargetStatus,
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
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
    expect(
      toInviteDisplayState(ShiftInviteStatus.AwaitingAdminApproval),
    ).toBe('requested');
    expect(toInviteDisplayState(ShiftInviteStatus.WaitlistJoined)).toBe(
      'requested',
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
        },
        12,
        {
          invited: 'invited',
          accepted: 'accepted',
          signedUp: 'signed up',
          spots: 'spots',
        },
      ),
    ).toBe('4 invited · 2 accepted · 1 signed up · 12 spots');
  });
});
