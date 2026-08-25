import {
  type EventInviteOrigin,
  type EventInviteStatus,
  ShiftInviteOrigin,
  ShiftInviteStatus,
} from '@repo/data';
import type { ShiftVolunteeringDisplayState } from '@repo/ui';

/** Shared invite origin + answer for shift + event (identical GraphQL values). */
export type InviteOrigin = ShiftInviteOrigin | EventInviteOrigin;
export type InviteStatus = ShiftInviteStatus | EventInviteStatus;

export type InvitePair = {
  origin?: InviteOrigin | null;
  status?: InviteStatus | null;
};

function originOf(invite: InvitePair): string | null {
  return invite.origin ?? null;
}

function statusOf(invite: InvitePair): string | null {
  return invite.status ?? null;
}

export function isParticipatingInvite(invite: InvitePair): boolean {
  const origin = originOf(invite);
  const status = statusOf(invite);
  return (
    (origin === ShiftInviteOrigin.VolunteerJoined && status == null) ||
    (origin === ShiftInviteOrigin.AdminInvited &&
      status === ShiftInviteStatus.VolunteerAccepted) ||
    (origin === ShiftInviteOrigin.VolunteerApplied &&
      status === ShiftInviteStatus.AdminAccepted) ||
    (origin === ShiftInviteOrigin.AdminInvited &&
      status === ShiftInviteStatus.AdminAccepted)
  );
}

export function isOutstandingInvite(invite: InvitePair): boolean {
  return (
    originOf(invite) === ShiftInviteOrigin.AdminInvited &&
    statusOf(invite) == null
  );
}

/** Whether an admin can remove a volunteer (outstanding invite or a seat). */
export function canAdminUninvite(invite: InvitePair): boolean {
  return isOutstandingInvite(invite) || isParticipatingInvite(invite);
}

/** Target answer when an admin removes a volunteer. */
export function adminUninviteTargetStatus(
  invite: InvitePair,
): ShiftInviteStatus.AdminCancelled | ShiftInviteStatus.AdminRejected | null {
  if (isParticipatingInvite(invite)) {
    return ShiftInviteStatus.AdminCancelled;
  }
  if (isOutstandingInvite(invite)) {
    return ShiftInviteStatus.AdminRejected;
  }
  return null;
}

/** Whether an admin can re-invite after an admin-ended row. */
export function canAdminReinvite(invite: InvitePair): boolean {
  const status = statusOf(invite);
  return (
    status === ShiftInviteStatus.AdminRejected ||
    status === ShiftInviteStatus.AdminCancelled
  );
}

/**
 * GraphQL `status` payload for admin re-invite (`null` = waiting).
 * Returns `undefined` when the row cannot be re-invited.
 */
export function adminReinviteTargetStatus(
  invite: InvitePair,
): null | undefined {
  if (!canAdminReinvite(invite)) {
    return undefined;
  }
  return null;
}

/**
 * Invite-sheet defaults: keep ADMIN_REJECTED and ADMIN_CANCELLED off the
 * Invited column so saving the sheet does not silently re-invite them.
 */
export function preselectedInviteMemberIds(
  members: ReadonlyArray<{ id: string } & InvitePair>,
): string[] {
  return members
    .filter((member) => !canAdminReinvite(member))
    .map((member) => member.id);
}

/** Domain origin + answer → backoffice display state (VOLI-842 / VOLI-1139). */
export function toInviteDisplayState(
  invite: InvitePair,
): ShiftVolunteeringDisplayState {
  const origin = originOf(invite);
  const status = statusOf(invite);

  if (status === ShiftInviteStatus.VolunteerRejected) {
    return 'declined';
  }
  if (status === ShiftInviteStatus.VolunteerCancelled) {
    return 'cancelled';
  }
  if (
    status === ShiftInviteStatus.AdminRejected ||
    status === ShiftInviteStatus.AdminCancelled
  ) {
    return 'rejected';
  }
  if (
    origin === ShiftInviteOrigin.AdminInvited &&
    status === ShiftInviteStatus.VolunteerAccepted
  ) {
    return 'accepted';
  }
  if (origin === ShiftInviteOrigin.VolunteerJoined && status == null) {
    return 'signed_up';
  }
  if (origin === ShiftInviteOrigin.AdminInvited && status == null) {
    return 'invited';
  }
  // Unused this slice: application waiting / admin confirmed.
  if (origin === ShiftInviteOrigin.VolunteerApplied && status == null) {
    return 'invited';
  }
  if (status === ShiftInviteStatus.AdminAccepted) {
    return 'accepted';
  }
  return 'invited';
}

export type InviteStatusCounts = {
  invited: number;
  accepted: number;
  signedUp: number;
  declined: number;
  cancelled: number;
  rejected: number;
};

export function countInviteDisplayStates(
  invites: readonly InvitePair[],
): InviteStatusCounts {
  const counts: InviteStatusCounts = {
    invited: 0,
    accepted: 0,
    signedUp: 0,
    declined: 0,
    cancelled: 0,
    rejected: 0,
  };

  for (const invite of invites) {
    switch (toInviteDisplayState(invite)) {
      case 'invited':
        counts.invited += 1;
        break;
      case 'accepted':
        counts.accepted += 1;
        break;
      case 'signed_up':
        counts.signedUp += 1;
        break;
      case 'declined':
        counts.declined += 1;
        break;
      case 'cancelled':
        counts.cancelled += 1;
        break;
      case 'rejected':
        counts.rejected += 1;
        break;
      default:
        break;
    }
  }

  return counts;
}

/** Summary line for instance detail, e.g. "4 invited · 2 accepted · 1 signed up · 12 spots". */
export function formatInviteStatusSummary(
  counts: InviteStatusCounts,
  spots: number | null | undefined,
  labels: {
    invited: string;
    accepted: string;
    signedUp: string;
    spots: string;
  },
): string {
  const parts = [
    `${counts.invited} ${labels.invited}`,
    `${counts.accepted} ${labels.accepted}`,
    `${counts.signedUp} ${labels.signedUp}`,
  ];
  if (spots != null) {
    parts.push(`${spots} ${labels.spots}`);
  }
  return parts.join(' · ');
}
