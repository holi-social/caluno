import { describe, expect, it } from 'bun:test';
import { ShiftInviteStatus } from '../shift/enums';
import {
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
    expect(isParticipatingShiftInviteStatus(ShiftInviteStatus.REJECTED)).toBe(
      false,
    );
    expect(isParticipatingShiftInviteStatus(ShiftInviteStatus.CANCELLED)).toBe(
      false,
    );
  });
});
