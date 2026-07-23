import { describe, expect, it } from 'bun:test';
import { EventInviteStatus } from '../event/enums';
import { ShiftInviteStatus } from '../shift/enums';
import {
  canTransitionInviteStatus,
  isParticipatingShiftInviteStatus,
  PARTICIPATING_SHIFT_INVITE_STATUSES,
} from './invite-status';

describe('invite-status', () => {
  it('defines participating statuses as ACCEPTED and SELF_JOINED', () => {
    expect(PARTICIPATING_SHIFT_INVITE_STATUSES).toEqual([
      ShiftInviteStatus.ACCEPTED,
      ShiftInviteStatus.SELF_JOINED,
    ]);
  });

  it('returns true only for participating statuses', () => {
    expect(isParticipatingShiftInviteStatus(ShiftInviteStatus.ACCEPTED)).toBe(
      true,
    );
    expect(
      isParticipatingShiftInviteStatus(ShiftInviteStatus.SELF_JOINED),
    ).toBe(true);
    expect(isParticipatingShiftInviteStatus(ShiftInviteStatus.INVITED)).toBe(
      false,
    );
    expect(
      isParticipatingShiftInviteStatus(ShiftInviteStatus.VOLUNTEER_REJECTED),
    ).toBe(false);
    expect(isParticipatingShiftInviteStatus(ShiftInviteStatus.CANCELLED)).toBe(
      false,
    );
    expect(
      isParticipatingShiftInviteStatus(ShiftInviteStatus.ADMIN_REJECTED),
    ).toBe(false);
  });

  describe('canTransitionInviteStatus', () => {
    it('allows idempotent transitions', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.INVITED,
          ShiftInviteStatus.INVITED,
        ),
      ).toBe(true);
    });

    it('allows INVITED to ACCEPTED, VOLUNTEER_REJECTED, or ADMIN_REJECTED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.INVITED,
          ShiftInviteStatus.ACCEPTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.INVITED,
          ShiftInviteStatus.VOLUNTEER_REJECTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.INVITED,
          ShiftInviteStatus.ADMIN_REJECTED,
        ),
      ).toBe(true);
    });

    it('allows VOLUNTEER_REJECTED to ACCEPTED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.VOLUNTEER_REJECTED,
          ShiftInviteStatus.ACCEPTED,
        ),
      ).toBe(true);
    });

    it('allows ACCEPTED and SELF_JOINED to CANCELLED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ACCEPTED,
          ShiftInviteStatus.CANCELLED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.SELF_JOINED,
          ShiftInviteStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('allows SELF_JOINED to ADMIN_REJECTED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.SELF_JOINED,
          ShiftInviteStatus.ADMIN_REJECTED,
        ),
      ).toBe(true);
    });

    it('allows ADMIN_REJECTED to INVITED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.ADMIN_REJECTED,
          ShiftInviteStatus.INVITED,
        ),
      ).toBe(true);
    });

    it('allows CANCELLED to SELF_JOINED or ACCEPTED', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.CANCELLED,
          ShiftInviteStatus.SELF_JOINED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.CANCELLED,
          ShiftInviteStatus.ACCEPTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInviteStatus(
          EventInviteStatus.CANCELLED,
          EventInviteStatus.ACCEPTED,
        ),
      ).toBe(true);
    });

    it('rejects invalid transitions', () => {
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.INVITED,
          ShiftInviteStatus.CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionInviteStatus(
          ShiftInviteStatus.VOLUNTEER_REJECTED,
          ShiftInviteStatus.CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionInviteStatus(
          EventInviteStatus.CANCELLED,
          EventInviteStatus.INVITED,
        ),
      ).toBe(false);
    });
  });
});
