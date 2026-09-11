import { ShiftInviteStatus } from '@repo/data';

export function isJoinedShiftRosterStatus(
  myInviteStatus: ShiftInviteStatus | null | undefined,
): boolean {
  return myInviteStatus === ShiftInviteStatus.Joined;
}
