import { EventInviteStatus, ShiftInviteStatus } from '@repo/data';
import type { ShiftVolunteeringDisplayState } from '@repo/ui';

/** Shared invite-status values for shift + event (identical GraphQL enums). */
export type InviteStatus = ShiftInviteStatus | EventInviteStatus;

const ADMIN_UNINVITE_SOURCE_STATUSES = [
  ShiftInviteStatus.Invited,
  ShiftInviteStatus.SelfJoined,
  ShiftInviteStatus.Accepted,
] as const;

/** Whether an admin can remove a volunteer from an instance (→ ADMIN_REJECTED). */
export function canAdminUninvite(status: ShiftInviteStatus): boolean {
  return ADMIN_UNINVITE_SOURCE_STATUSES.includes(
    status as (typeof ADMIN_UNINVITE_SOURCE_STATUSES)[number],
  );
}

/** Target status when an admin removes a volunteer from an instance. */
export function adminUninviteTargetStatus(
  status: ShiftInviteStatus,
): ShiftInviteStatus | null {
  return canAdminUninvite(status) ? ShiftInviteStatus.AdminRejected : null;
}

/** Whether an admin can re-invite a previously rejected volunteer (→ INVITED). */
export function canAdminReinvite(status: ShiftInviteStatus): boolean {
  return status === ShiftInviteStatus.AdminRejected;
}

/** Target status when an admin re-invites a rejected volunteer. */
export function adminReinviteTargetStatus(
  status: ShiftInviteStatus,
): ShiftInviteStatus | null {
  return canAdminReinvite(status) ? ShiftInviteStatus.Invited : null;
}

/** Domain invite status → backoffice display state (VOLI-842). */
export function toInviteDisplayState(
  status: InviteStatus,
): ShiftVolunteeringDisplayState {
  switch (status) {
    case ShiftInviteStatus.Invited:
    case EventInviteStatus.Invited:
      return 'invited';
    case ShiftInviteStatus.Accepted:
    case EventInviteStatus.Accepted:
      return 'accepted';
    case ShiftInviteStatus.SelfJoined:
    case EventInviteStatus.SelfJoined:
      return 'signed_up';
    case ShiftInviteStatus.VolunteerRejected:
    case EventInviteStatus.VolunteerRejected:
      return 'declined';
    case ShiftInviteStatus.Cancelled:
    case EventInviteStatus.Cancelled:
      return 'cancelled';
    case ShiftInviteStatus.AdminRejected:
    case EventInviteStatus.AdminRejected:
      return 'rejected';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
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
  statuses: readonly InviteStatus[],
): InviteStatusCounts {
  const counts: InviteStatusCounts = {
    invited: 0,
    accepted: 0,
    signedUp: 0,
    declined: 0,
    cancelled: 0,
    rejected: 0,
  };

  for (const status of statuses) {
    switch (toInviteDisplayState(status)) {
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
