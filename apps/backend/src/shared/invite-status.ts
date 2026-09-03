import { EventInviteStatus } from '../event/enums';
import { ShiftInviteStatus } from '../shift/enums';

export type InviteStatusValue = ShiftInviteStatus | EventInviteStatus;

/**
 * Allowed transitions per models/Invite-states.plantuml.
 * Capacity/approval resolve which of several legal targets is chosen at runtime.
 */
const INVITE_STATUS_TRANSITIONS: Record<
  InviteStatusValue,
  readonly InviteStatusValue[]
> = {
  [ShiftInviteStatus.ADMIN_INVITED]: [
    ShiftInviteStatus.VOLUNTEER_REJECTED,
    ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
    ShiftInviteStatus.WAITLIST_JOINED,
    ShiftInviteStatus.JOINED,
    ShiftInviteStatus.ADMIN_REJECTED,
  ],
  [ShiftInviteStatus.VOLUNTEER_REJECTED]: [
    ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
    ShiftInviteStatus.WAITLIST_JOINED,
    ShiftInviteStatus.JOINED,
  ],
  [ShiftInviteStatus.AWAITING_ADMIN_APPROVAL]: [
    ShiftInviteStatus.ADMIN_REJECTED,
    ShiftInviteStatus.VOLUNTEER_REJECTED,
    ShiftInviteStatus.WAITLIST_JOINED,
    ShiftInviteStatus.JOINED,
  ],
  [ShiftInviteStatus.WAITLIST_JOINED]: [
    ShiftInviteStatus.JOINED,
    ShiftInviteStatus.VOLUNTEER_CANCELLED,
    ShiftInviteStatus.ADMIN_REJECTED,
  ],
  [ShiftInviteStatus.JOINED]: [
    ShiftInviteStatus.VOLUNTEER_CANCELLED,
    ShiftInviteStatus.ADMIN_REJECTED,
  ],
  [ShiftInviteStatus.VOLUNTEER_CANCELLED]: [
    ShiftInviteStatus.JOINED,
    ShiftInviteStatus.WAITLIST_JOINED,
  ],
  [ShiftInviteStatus.ADMIN_REJECTED]: [ShiftInviteStatus.ADMIN_INVITED],
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

export type ResolveJoinTargetOptions = {
  joinRequiresApproval: boolean;
  hasAvailableSeat: boolean;
  /** Events have no capacity — never waitlist. */
  allowWaitlist: boolean;
  /**
   * PlantUML: approval applies to initial join / accept / re-join from
   * VOLUNTEER_REJECTED, but not to re-join from VOLUNTEER_CANCELLED.
   */
  considerApproval: boolean;
};

/** Resolve the status a volunteer join/accept/re-join should land on. */
export function resolveVolunteerJoinTargetStatus(
  options: ResolveJoinTargetOptions,
): InviteStatusValue {
  if (options.considerApproval && options.joinRequiresApproval) {
    return ShiftInviteStatus.AWAITING_ADMIN_APPROVAL;
  }
  if (!options.hasAvailableSeat && options.allowWaitlist) {
    return ShiftInviteStatus.WAITLIST_JOINED;
  }
  return ShiftInviteStatus.JOINED;
}

/** Resolve admin approve from AWAITING_ADMIN_APPROVAL. */
export function resolveAdminApprovalTargetStatus(options: {
  hasAvailableSeat: boolean;
  allowWaitlist: boolean;
}): InviteStatusValue {
  if (!options.hasAvailableSeat && options.allowWaitlist) {
    return ShiftInviteStatus.WAITLIST_JOINED;
  }
  return ShiftInviteStatus.JOINED;
}

/** Statuses that occupy a seat / count toward filledCount. */
export const PARTICIPATING_EVENT_INVITE_STATUSES = [
  EventInviteStatus.JOINED,
] as const;

export function isParticipatingEventInviteStatus(
  status?: EventInviteStatus,
): boolean {
  return status === EventInviteStatus.JOINED;
}

export const PARTICIPATING_SHIFT_INVITE_STATUSES = [
  ShiftInviteStatus.JOINED,
] as const;

export function isParticipatingShiftInviteStatus(
  status?: ShiftInviteStatus,
): boolean {
  return status === ShiftInviteStatus.JOINED;
}

/** Pending or participating — currently "on" the shift/event roster. */
export const ACTIVE_SHIFT_INVITE_STATUSES: readonly ShiftInviteStatus[] = [
  ShiftInviteStatus.ADMIN_INVITED,
  ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
  ShiftInviteStatus.WAITLIST_JOINED,
  ShiftInviteStatus.JOINED,
] as const;

export const ACTIVE_EVENT_INVITE_STATUSES = [
  EventInviteStatus.ADMIN_INVITED,
  EventInviteStatus.AWAITING_ADMIN_APPROVAL,
  EventInviteStatus.WAITLIST_JOINED,
  EventInviteStatus.JOINED,
] as const;

export const ADMIN_UNINVITE_SOURCE_STATUSES = ACTIVE_SHIFT_INVITE_STATUSES;

export const ADMIN_LIST_EVENT_INVITE_STATUSES = [
  ...ACTIVE_EVENT_INVITE_STATUSES,
  EventInviteStatus.ADMIN_REJECTED,
] as const;

/** States from which a volunteer "join intent" resolves via capacity/approval. */
export const VOLUNTEER_JOIN_RESOLVE_SOURCE_STATUSES = [
  ShiftInviteStatus.ADMIN_INVITED,
  ShiftInviteStatus.VOLUNTEER_REJECTED,
  ShiftInviteStatus.VOLUNTEER_CANCELLED,
] as const;

export function isVolunteerJoinResolveSource(
  status: InviteStatusValue,
): boolean {
  return (
    status === ShiftInviteStatus.ADMIN_INVITED ||
    status === ShiftInviteStatus.VOLUNTEER_REJECTED ||
    status === ShiftInviteStatus.VOLUNTEER_CANCELLED
  );
}

/**
 * Whether a non-admin (self) actor may request `to` from current `from`.
 * JOINED / WAITLIST_JOINED are only from volunteer join-resolve sources
 * (accept / re-join); admin approval and waitlist promotion are admin-only.
 */
export function volunteerMayRequestInviteStatus(
  from: InviteStatusValue,
  to: InviteStatusValue,
): boolean {
  if (from === to) {
    return true;
  }

  if (
    to === ShiftInviteStatus.ADMIN_REJECTED ||
    to === ShiftInviteStatus.ADMIN_INVITED
  ) {
    return false;
  }

  if (
    to === ShiftInviteStatus.JOINED ||
    to === ShiftInviteStatus.WAITLIST_JOINED
  ) {
    return isVolunteerJoinResolveSource(from);
  }

  return true;
}
