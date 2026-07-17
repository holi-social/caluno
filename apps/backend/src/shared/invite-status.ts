import { EventInviteStatus } from '../event/enums';
import { ShiftInviteStatus } from '../shift/enums';

export const PARTICIPATING_EVENT_INVITE_STATUSES = [
  EventInviteStatus.ACCEPTED,
  EventInviteStatus.SELF_JOINED,
] as const;

export function isParticipatingEventInviteStatus(
  status?: EventInviteStatus,
): boolean {
  return (
    status === EventInviteStatus.ACCEPTED ||
    status === EventInviteStatus.SELF_JOINED
  );
}

export const PARTICIPATING_SHIFT_INVITE_STATUSES = [
  ShiftInviteStatus.ACCEPTED,
  ShiftInviteStatus.SELF_JOINED,
] as const;

export function isParticipatingShiftInviteStatus(
  status?: ShiftInviteStatus,
): boolean {
  return (
    status === ShiftInviteStatus.ACCEPTED ||
    status === ShiftInviteStatus.SELF_JOINED
  );
}
