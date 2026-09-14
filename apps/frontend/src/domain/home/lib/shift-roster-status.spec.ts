import { describe, expect, it } from 'bun:test';
import { ShiftInviteStatus } from '@repo/data';
import { isJoinedShiftRosterStatus } from './shift-roster-status';

describe('isJoinedShiftRosterStatus', () => {
  it('returns true only for JOINED', () => {
    expect(isJoinedShiftRosterStatus(ShiftInviteStatus.Joined)).toBe(true);
    expect(
      isJoinedShiftRosterStatus(ShiftInviteStatus.AwaitingAdminApproval),
    ).toBe(false);
    expect(isJoinedShiftRosterStatus(ShiftInviteStatus.WaitlistJoined)).toBe(
      false,
    );
    expect(isJoinedShiftRosterStatus(null)).toBe(false);
    expect(isJoinedShiftRosterStatus(undefined)).toBe(false);
  });
});
