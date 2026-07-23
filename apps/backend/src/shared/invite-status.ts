import { EventInviteStatus } from '../event/enums';
import { ShiftInviteStatus } from '../shift/enums';

export type InviteStatusValue = ShiftInviteStatus | EventInviteStatus;

const INVITE_STATUS_TRANSITIONS: Record<
  InviteStatusValue,
  readonly InviteStatusValue[]
> = {
  [ShiftInviteStatus.INVITED]: [
    ShiftInviteStatus.ACCEPTED,
    ShiftInviteStatus.VOLUNTEER_REJECTED,
  ],
  [ShiftInviteStatus.VOLUNTEER_REJECTED]: [ShiftInviteStatus.ACCEPTED],
  [ShiftInviteStatus.ACCEPTED]: [ShiftInviteStatus.CANCELLED],
  [ShiftInviteStatus.SELF_JOINED]: [ShiftInviteStatus.CANCELLED],
  [ShiftInviteStatus.CANCELLED]: [
    ShiftInviteStatus.SELF_JOINED,
    ShiftInviteStatus.ACCEPTED,
  ],
};

export function canTransitionInviteStatus(
  from: InviteStatusValue,
  to: InviteStatusValue,
): boolean {
  if (from === to) {
    return true;
  }

  return INVITE_STATUS_TRANSITIONS[from].includes(to);
}

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
