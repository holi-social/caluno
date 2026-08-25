import { describe, expect, it } from 'bun:test';
import {
  EventInviteOrigin,
  EventInviteStatus,
  ShiftInviteOrigin,
  ShiftInviteStatus,
} from '@repo/data';
import {
  adminReinviteTargetStatus,
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  isOutstandingInvite,
  isParticipatingInvite,
  preselectedInviteMemberIds,
  toInviteDisplayState,
} from './invite-status-display';

const outstanding = {
  origin: ShiftInviteOrigin.AdminInvited,
  status: null,
};
const accepted = {
  origin: ShiftInviteOrigin.AdminInvited,
  status: ShiftInviteStatus.VolunteerAccepted,
};
const signedUp = {
  origin: ShiftInviteOrigin.VolunteerJoined,
  status: null,
};
const volunteerRejected = {
  origin: ShiftInviteOrigin.AdminInvited,
  status: ShiftInviteStatus.VolunteerRejected,
};
const volunteerCancelled = {
  origin: ShiftInviteOrigin.VolunteerJoined,
  status: ShiftInviteStatus.VolunteerCancelled,
};
const adminRejected = {
  origin: ShiftInviteOrigin.AdminInvited,
  status: ShiftInviteStatus.AdminRejected,
};
const adminCancelled = {
  origin: ShiftInviteOrigin.VolunteerJoined,
  status: ShiftInviteStatus.AdminCancelled,
};

describe('isParticipatingInvite', () => {
  it('is true for signed-up and accepted seats', () => {
    expect(isParticipatingInvite(signedUp)).toBe(true);
    expect(isParticipatingInvite(accepted)).toBe(true);
    expect(isParticipatingInvite(outstanding)).toBe(false);
    expect(isParticipatingInvite(adminRejected)).toBe(false);
    expect(isParticipatingInvite(adminCancelled)).toBe(false);
    expect(isParticipatingInvite(volunteerCancelled)).toBe(false);
  });
});

describe('canAdminUninvite', () => {
  it('returns true for outstanding invites and participating seats', () => {
    expect(canAdminUninvite(outstanding)).toBe(true);
    expect(canAdminUninvite(signedUp)).toBe(true);
    expect(canAdminUninvite(accepted)).toBe(true);
    expect(canAdminUninvite(volunteerRejected)).toBe(false);
    expect(canAdminUninvite(volunteerCancelled)).toBe(false);
    expect(canAdminUninvite(adminRejected)).toBe(false);
  });

  it('works for event invite origin + status the same way', () => {
    expect(
      canAdminUninvite({
        origin: EventInviteOrigin.AdminInvited,
        status: null,
      }),
    ).toBe(true);
    expect(
      canAdminUninvite({
        origin: EventInviteOrigin.VolunteerJoined,
        status: null,
      }),
    ).toBe(true);
    expect(
      canAdminUninvite({
        origin: EventInviteOrigin.AdminInvited,
        status: EventInviteStatus.AdminRejected,
      }),
    ).toBe(false);
  });
});

describe('adminUninviteTargetStatus', () => {
  it('splits outstanding vs participating', () => {
    expect(adminUninviteTargetStatus(outstanding)).toBe(
      ShiftInviteStatus.AdminRejected,
    );
    expect(adminUninviteTargetStatus(signedUp)).toBe(
      ShiftInviteStatus.AdminCancelled,
    );
    expect(adminUninviteTargetStatus(accepted)).toBe(
      ShiftInviteStatus.AdminCancelled,
    );
  });

  it('returns null for statuses that cannot be uninvited', () => {
    expect(adminUninviteTargetStatus(volunteerRejected)).toBeNull();
    expect(adminUninviteTargetStatus(volunteerCancelled)).toBeNull();
    expect(adminUninviteTargetStatus(adminRejected)).toBeNull();
  });
});

describe('canAdminReinvite', () => {
  it('returns true for both admin-ended answers', () => {
    expect(canAdminReinvite(adminRejected)).toBe(true);
    expect(canAdminReinvite(adminCancelled)).toBe(true);
    expect(canAdminReinvite(outstanding)).toBe(false);
    expect(canAdminReinvite(accepted)).toBe(false);
  });
});

describe('adminReinviteTargetStatus', () => {
  it('returns null (waiting) for admin-ended rows', () => {
    expect(adminReinviteTargetStatus(adminRejected)).toBeNull();
    expect(adminReinviteTargetStatus(adminCancelled)).toBeNull();
  });

  it('returns undefined when the row cannot be re-invited', () => {
    expect(adminReinviteTargetStatus(outstanding)).toBeUndefined();
    expect(adminReinviteTargetStatus(accepted)).toBeUndefined();
  });
});

describe('preselectedInviteMemberIds', () => {
  it('excludes ADMIN_REJECTED and ADMIN_CANCELLED so invite sheets do not silently re-invite', () => {
    expect(
      preselectedInviteMemberIds([
        { id: 'a', origin: EventInviteOrigin.AdminInvited, status: null },
        {
          id: 'b',
          origin: EventInviteOrigin.AdminInvited,
          status: EventInviteStatus.VolunteerAccepted,
        },
        {
          id: 'c',
          origin: EventInviteOrigin.AdminInvited,
          status: EventInviteStatus.AdminRejected,
        },
        {
          id: 'e',
          origin: EventInviteOrigin.VolunteerJoined,
          status: EventInviteStatus.AdminCancelled,
        },
        { id: 'd', origin: null, status: null },
      ]),
    ).toEqual(['a', 'b', 'd']);
  });
});

describe('toInviteDisplayState', () => {
  it('maps origin + status to distinct display states', () => {
    expect(toInviteDisplayState(outstanding)).toBe('invited');
    expect(toInviteDisplayState(accepted)).toBe('accepted');
    expect(toInviteDisplayState(signedUp)).toBe('signed_up');
    expect(toInviteDisplayState(volunteerRejected)).toBe('declined');
    expect(toInviteDisplayState(volunteerCancelled)).toBe('cancelled');
    expect(toInviteDisplayState(adminRejected)).toBe('rejected');
    expect(toInviteDisplayState(adminCancelled)).toBe('rejected');
  });

  it('keeps accepted distinct from signed up', () => {
    expect(toInviteDisplayState(accepted)).not.toBe(
      toInviteDisplayState(signedUp),
    );
  });

  it('does not treat outstanding as signed up', () => {
    expect(isOutstandingInvite(outstanding)).toBe(true);
    expect(toInviteDisplayState(outstanding)).not.toBe(
      toInviteDisplayState(signedUp),
    );
  });
});

describe('countInviteDisplayStates', () => {
  it('counts invite pairs for the summary line', () => {
    expect(
      countInviteDisplayStates([
        outstanding,
        outstanding,
        accepted,
        signedUp,
        adminRejected,
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
