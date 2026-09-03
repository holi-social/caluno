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
    ShiftInviteStatus.ADMIN_REJECTED,
  ],
  [ShiftInviteStatus.VOLUNTEER_REJECTED]: [ShiftInviteStatus.ACCEPTED],
  [ShiftInviteStatus.ADMIN_REJECTED]: [ShiftInviteStatus.INVITED],
  [ShiftInviteStatus.ACCEPTED]: [
    ShiftInviteStatus.CANCELLED,
    ShiftInviteStatus.ADMIN_REJECTED,
  ],
  [ShiftInviteStatus.SELF_JOINED]: [
    ShiftInviteStatus.CANCELLED,
    ShiftInviteStatus.ADMIN_REJECTED,
  ],
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

/** Statuses that count as "currently invited" — pending or participating. */
export const ACTIVE_SHIFT_INVITE_STATUSES: readonly ShiftInviteStatus[] = [
  ShiftInviteStatus.INVITED,
  ...PARTICIPATING_SHIFT_INVITE_STATUSES,
];

export const ACTIVE_EVENT_INVITE_STATUSES = [
  EventInviteStatus.INVITED,
  ...PARTICIPATING_EVENT_INVITE_STATUSES,
] as const;

export const ADMIN_UNINVITE_SOURCE_STATUSES = ACTIVE_SHIFT_INVITE_STATUSES;

export const ADMIN_LIST_EVENT_INVITE_STATUSES = [
  ...ACTIVE_EVENT_INVITE_STATUSES,
  EventInviteStatus.ADMIN_REJECTED,
] as const;
