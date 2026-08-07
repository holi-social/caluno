import { describe, expect, it } from 'bun:test';
import { EventInviteStatus, ShiftInviteStatus } from '@repo/data';
import {
  adminReinviteTargetStatus,
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  toInviteDisplayState,
} from './invite-status-display';

describe('canAdminUninvite', () => {
  it('returns true only for INVITED, SELF_JOINED, and ACCEPTED', () => {
    expect(canAdminUninvite(ShiftInviteStatus.Invited)).toBe(true);
    expect(canAdminUninvite(ShiftInviteStatus.SelfJoined)).toBe(true);
    expect(canAdminUninvite(ShiftInviteStatus.Accepted)).toBe(true);
    expect(canAdminUninvite(ShiftInviteStatus.VolunteerRejected)).toBe(false);
    expect(canAdminUninvite(ShiftInviteStatus.Cancelled)).toBe(false);
    expect(canAdminUninvite(ShiftInviteStatus.AdminRejected)).toBe(false);
  });

  it('works for event invite statuses the same way', () => {
    expect(canAdminUninvite(EventInviteStatus.Invited)).toBe(true);
    expect(canAdminUninvite(EventInviteStatus.Accepted)).toBe(true);
    expect(canAdminUninvite(EventInviteStatus.SelfJoined)).toBe(true);
    expect(canAdminUninvite(EventInviteStatus.AdminRejected)).toBe(false);
  });
});

describe('adminUninviteTargetStatus', () => {
  it('returns ADMIN_REJECTED for uninvitable statuses', () => {
    expect(adminUninviteTargetStatus(ShiftInviteStatus.Invited)).toBe(
      ShiftInviteStatus.AdminRejected,
    );
    expect(adminUninviteTargetStatus(ShiftInviteStatus.SelfJoined)).toBe(
      ShiftInviteStatus.AdminRejected,
    );
    expect(adminUninviteTargetStatus(ShiftInviteStatus.Accepted)).toBe(
      ShiftInviteStatus.AdminRejected,
    );
  });

  it('returns null for statuses that cannot be uninvited', () => {
    expect(
      adminUninviteTargetStatus(ShiftInviteStatus.VolunteerRejected),
    ).toBeNull();
    expect(adminUninviteTargetStatus(ShiftInviteStatus.Cancelled)).toBeNull();
    expect(
      adminUninviteTargetStatus(ShiftInviteStatus.AdminRejected),
    ).toBeNull();
  });
});

describe('canAdminReinvite', () => {
  it('returns true only for ADMIN_REJECTED', () => {
    expect(canAdminReinvite(ShiftInviteStatus.AdminRejected)).toBe(true);
    expect(canAdminReinvite(ShiftInviteStatus.Invited)).toBe(false);
    expect(canAdminReinvite(ShiftInviteStatus.Accepted)).toBe(false);
  });
});

describe('adminReinviteTargetStatus', () => {
  it('returns INVITED for ADMIN_REJECTED', () => {
    expect(adminReinviteTargetStatus(ShiftInviteStatus.AdminRejected)).toBe(
      ShiftInviteStatus.Invited,
    );
  });

  it('returns null for other statuses', () => {
    expect(adminReinviteTargetStatus(ShiftInviteStatus.Invited)).toBeNull();
    expect(adminReinviteTargetStatus(ShiftInviteStatus.Accepted)).toBeNull();
  });
});

describe('toInviteDisplayState', () => {
  it('maps each domain status to a distinct display state', () => {
    expect(toInviteDisplayState(ShiftInviteStatus.Invited)).toBe('invited');
    expect(toInviteDisplayState(ShiftInviteStatus.Accepted)).toBe('accepted');
    expect(toInviteDisplayState(ShiftInviteStatus.SelfJoined)).toBe(
      'signed_up',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.VolunteerRejected)).toBe(
      'declined',
    );
    expect(toInviteDisplayState(ShiftInviteStatus.Cancelled)).toBe('cancelled');
    expect(toInviteDisplayState(ShiftInviteStatus.AdminRejected)).toBe(
      'rejected',
    );
  });

  it('keeps ACCEPTED distinct from SELF_JOINED', () => {
    expect(toInviteDisplayState(ShiftInviteStatus.Accepted)).not.toBe(
      toInviteDisplayState(ShiftInviteStatus.SelfJoined),
    );
  });
});

describe('countInviteDisplayStates', () => {
  it('counts invite statuses for the summary line', () => {
    expect(
      countInviteDisplayStates([
        ShiftInviteStatus.Invited,
        ShiftInviteStatus.Invited,
        ShiftInviteStatus.Accepted,
        ShiftInviteStatus.SelfJoined,
        ShiftInviteStatus.AdminRejected,
      ]),
    ).toEqual({
      invited: 2,
      accepted: 1,
      signedUp: 1,
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
