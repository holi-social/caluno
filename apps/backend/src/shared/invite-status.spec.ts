import { describe, expect, it } from 'bun:test';
import { EventInviteStatus } from '../event/enums';
import { ShiftInviteStatus } from '../shift/enums';
import {
  canTransitionInviteStatus,
  isParticipatingShiftInviteStatus,
  PARTICIPATING_SHIFT_INVITE_STATUSES,
  resolveAdminApprovalTargetStatus,
  resolveVolunteerJoinTargetStatus,
} from './invite-status';

describe('invite-status', () => {
  it('defines participating statuses as JOINED only', () => {
    expect(PARTICIPATING_SHIFT_INVITE_STATUSES).toEqual([
      ShiftInviteStatus.JOINED,
    ]);
  });

  it('returns true only for JOINED', () => {
    expect(isParticipatingShiftInviteStatus(ShiftInviteStatus.JOINED)).toBe(
      true,
    );
    expect(
      isParticipatingShiftInviteStatus(ShiftInviteStatus.ADMIN_INVITED),
    ).toBe(false);
    expect(
      isParticipatingShiftInviteStatus(
        ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
      ),
    ).toBe(false);
    expect(
      isParticipatingShiftInviteStatus(ShiftInviteStatus.WAITLIST_JOINED),
    ).toBe(false);
    expect(
      isParticipatingShiftInviteStatus(ShiftInviteStatus.VOLUNTEER_CANCELLED),
    ).toBe(false);
  });

  describe('resolveVolunteerJoinTargetStatus', () => {
    it('returns AWAITING when approval is considered and enabled', () => {
      expect(
        resolveVolunteerJoinTargetStatus({
          joinRequiresApproval: true,
          hasAvailableSeat: true,
          allowWaitlist: true,
          considerApproval: true,
        }),
      ).toBe(ShiftInviteStatus.AWAITING_ADMIN_APPROVAL);
    });

    it('returns WAITLIST when full and waitlist allowed', () => {
      expect(
        resolveVolunteerJoinTargetStatus({
          joinRequiresApproval: false,
          hasAvailableSeat: false,
          allowWaitlist: true,
          considerApproval: true,
        }),
      ).toBe(ShiftInviteStatus.WAITLIST_JOINED);
    });

    it('returns JOINED when seat available and approval off', () => {
      expect(
        resolveVolunteerJoinTargetStatus({
          joinRequiresApproval: false,
          hasAvailableSeat: true,
          allowWaitlist: true,
          considerApproval: true,
        }),
      ).toBe(ShiftInviteStatus.JOINED);
    });

    it('ignores approval when considerApproval is false (cancel re-join)', () => {
      expect(
        resolveVolunteerJoinTargetStatus({
          joinRequiresApproval: true,
          hasAvailableSeat: false,
          allowWaitlist: true,
          considerApproval: false,
        }),
      ).toBe(ShiftInviteStatus.WAITLIST_JOINED);
    });

    it('never waitlists when allowWaitlist is false (events)', () => {
      expect(
        resolveVolunteerJoinTargetStatus({
          joinRequiresApproval: false,
          hasAvailableSeat: false,
          allowWaitlist: false,
          considerApproval: true,
        }),
      ).toBe(ShiftInviteStatus.JOINED);
    });
  });

  describe('resolveAdminApprovalTargetStatus', () => {
    it('waitlists when full', () => {
      expect(
        resolveAdminApprovalTargetStatus({
          hasAvailableSeat: false,
          allowWaitlist: true,
        }),
      ).toBe(ShiftInviteStatus.WAITLIST_JOINED);
    });

    it('joins when seat available', () => {
      expect(
        resolveAdminApprovalTargetStatus({
          hasAvailableSeat: true,
          allowWaitlist: true,
        }),
      ).toBe(ShiftInviteStatus.JOINED);
    });
  });

  describe('canTransitionInviteStatus', () => {
    it('allows idempotent transitions', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.ADMIN_INVITED,
        ),
      ).toBe(true);
    });

    it('allows ADMIN_INVITED to reject / await / waitlist / join / admin reject', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.VOLUNTEER_REJECTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.WAITLIST_JOINED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.JOINED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.ADMIN_REJECTED,
        ),
      ).toBe(true);
    });

    it('allows AWAITING to volunteer reject (cancel), not VOLUNTEER_CANCELLED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
          ShiftInviteStatus.VOLUNTEER_REJECTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
          ShiftInviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(false);
    });

    it('allows JOINED to VOLUNTEER_CANCELLED or ADMIN_REJECTED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.JOINED,
          ShiftInviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.JOINED,
          ShiftInviteStatus.ADMIN_REJECTED,
        ),
      ).toBe(true);
    });

    it('allows ADMIN_REJECTED to ADMIN_INVITED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_REJECTED,
          ShiftInviteStatus.ADMIN_INVITED,
        ),
      ).toBe(true);
    });

    it('allows VOLUNTEER_CANCELLED to JOINED or WAITLIST only', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.VOLUNTEER_CANCELLED,
          ShiftInviteStatus.JOINED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.VOLUNTEER_CANCELLED,
          ShiftInviteStatus.WAITLIST_JOINED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          EventInviteStatus.VOLUNTEER_CANCELLED,
          EventInviteStatus.ADMIN_INVITED,
        ),
      ).toBe(false);
    });

    it('rejects invalid transitions', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_INVITED,
          ShiftInviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.VOLUNTEER_REJECTED,
          ShiftInviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionInviteStatus(
          EventInviteStatus.JOINED,
          EventInviteStatus.ADMIN_INVITED,
        ),
      ).toBe(false);
    });
  });
});
