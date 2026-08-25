import { and, eq, isNull, or, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { EventInviteOrigin, EventInviteStatus } from '../event/enums';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../shift/enums';
import { InviteOrigin, InviteStatus } from './invite-enums';

export type InviteOriginValue =
  | InviteOrigin
  | ShiftInviteOrigin
  | EventInviteOrigin
  | null;
export type InviteStatusValue =
  | InviteStatus
  | ShiftInviteStatus
  | EventInviteStatus
  | null;

export type BackfillInviteRow = {
  origin: InviteOrigin | null;
  status: InviteStatus | null;
};

/** Legacy single-status → origin + answer. Used by migration SQL assertions. */
export const INVITE_STATUS_BACKFILL: Record<string, BackfillInviteRow> = {
  INVITED: { origin: InviteOrigin.ADMIN_INVITED, status: null },
  ACCEPTED: {
    origin: InviteOrigin.ADMIN_INVITED,
    status: InviteStatus.VOLUNTEER_ACCEPTED,
  },
  SELF_JOINED: { origin: InviteOrigin.VOLUNTEER_JOINED, status: null },
  VOLUNTEER_REJECTED: {
    origin: InviteOrigin.ADMIN_INVITED,
    status: InviteStatus.VOLUNTEER_REJECTED,
  },
  ADMIN_REJECTED: { origin: null, status: InviteStatus.ADMIN_REJECTED },
  CANCELLED: { origin: null, status: InviteStatus.VOLUNTEER_CANCELLED },
};

export function isParticipatingInvite(
  origin: InviteOriginValue | undefined,
  status: InviteStatusValue | undefined,
): boolean {
  return (
    (origin === InviteOrigin.VOLUNTEER_JOINED && status == null) ||
    (origin === InviteOrigin.ADMIN_INVITED &&
      status === InviteStatus.VOLUNTEER_ACCEPTED) ||
    (origin === InviteOrigin.VOLUNTEER_APPLIED &&
      status === InviteStatus.ADMIN_ACCEPTED) ||
    (origin === InviteOrigin.ADMIN_INVITED &&
      status === InviteStatus.ADMIN_ACCEPTED)
  );
}

export function isOutstandingInvite(
  origin: InviteOriginValue | undefined,
  status: InviteStatusValue | undefined,
): boolean {
  return origin === InviteOrigin.ADMIN_INVITED && status == null;
}

export function isActiveInvite(
  origin: InviteOriginValue | undefined,
  status: InviteStatusValue | undefined,
): boolean {
  return (
    isParticipatingInvite(origin, status) || isOutstandingInvite(origin, status)
  );
}

export function isAdminEndedInvite(
  status: InviteStatusValue | undefined,
): boolean {
  return (
    status === InviteStatus.ADMIN_REJECTED ||
    status === InviteStatus.ADMIN_CANCELLED
  );
}

export function canAdminReinvite(
  _origin: InviteOriginValue | undefined,
  status: InviteStatusValue | undefined,
): boolean {
  return isAdminEndedInvite(status);
}

export function adminUninviteTargetStatus(
  origin: InviteOriginValue | undefined,
  status: InviteStatusValue | undefined,
): InviteStatus | null {
  if (isOutstandingInvite(origin, status)) {
    return InviteStatus.ADMIN_REJECTED;
  }
  if (isParticipatingInvite(origin, status)) {
    return InviteStatus.ADMIN_CANCELLED;
  }
  return null;
}

export function reinviteTarget(): {
  origin: InviteOrigin;
  status: null;
} {
  return { origin: InviteOrigin.ADMIN_INVITED, status: null };
}

export function canTransitionInvite(
  fromOrigin: InviteOriginValue | undefined,
  fromStatus: InviteStatusValue | undefined,
  toOrigin: InviteOriginValue | undefined,
  toStatus: InviteStatusValue | undefined,
): boolean {
  if (fromOrigin === toOrigin && fromStatus === toStatus) {
    return true;
  }

  if (
    isAdminEndedInvite(fromStatus) &&
    toOrigin === InviteOrigin.ADMIN_INVITED &&
    toStatus == null
  ) {
    return true;
  }

  if (isOutstandingInvite(fromOrigin, fromStatus) && fromOrigin === toOrigin) {
    return (
      toStatus === InviteStatus.VOLUNTEER_ACCEPTED ||
      toStatus === InviteStatus.VOLUNTEER_REJECTED ||
      toStatus === InviteStatus.ADMIN_REJECTED
    );
  }

  if (
    isParticipatingInvite(fromOrigin, fromStatus) &&
    fromOrigin === toOrigin
  ) {
    return (
      toStatus === InviteStatus.VOLUNTEER_CANCELLED ||
      toStatus === InviteStatus.ADMIN_CANCELLED
    );
  }

  if (
    fromStatus === InviteStatus.VOLUNTEER_REJECTED &&
    toStatus === InviteStatus.VOLUNTEER_ACCEPTED &&
    fromOrigin === toOrigin
  ) {
    return true;
  }

  if (
    fromStatus === InviteStatus.VOLUNTEER_CANCELLED &&
    toOrigin === InviteOrigin.VOLUNTEER_JOINED &&
    toStatus == null
  ) {
    return true;
  }

  return false;
}

/** RQ v2 `where` fragment for participating invites (nested under `invites`). */
export const PARTICIPATING_INVITE_WHERE = {
  OR: [
    {
      origin: InviteOrigin.VOLUNTEER_JOINED,
      status: { isNull: true as const },
    },
    {
      origin: InviteOrigin.ADMIN_INVITED,
      status: InviteStatus.VOLUNTEER_ACCEPTED,
    },
    {
      origin: InviteOrigin.VOLUNTEER_APPLIED,
      status: InviteStatus.ADMIN_ACCEPTED,
    },
    {
      origin: InviteOrigin.ADMIN_INVITED,
      status: InviteStatus.ADMIN_ACCEPTED,
    },
  ],
};

export const OUTSTANDING_INVITE_WHERE = {
  origin: InviteOrigin.ADMIN_INVITED,
  status: { isNull: true as const },
};

export const ACTIVE_INVITE_WHERE = {
  OR: [...PARTICIPATING_INVITE_WHERE.OR, OUTSTANDING_INVITE_WHERE],
};

export const ADMIN_ENDED_INVITE_WHERE = {
  status: {
    in: [InviteStatus.ADMIN_REJECTED, InviteStatus.ADMIN_CANCELLED],
  },
};

export const ADMIN_LIST_INVITE_WHERE = {
  OR: [
    ...ACTIVE_INVITE_WHERE.OR,
    { status: InviteStatus.ADMIN_REJECTED },
    { status: InviteStatus.ADMIN_CANCELLED },
  ],
};

export function participatingInviteSql(
  originCol: AnyPgColumn,
  statusCol: AnyPgColumn,
): SQL {
  return or(
    and(eq(originCol, InviteOrigin.VOLUNTEER_JOINED), isNull(statusCol)),
    and(
      eq(originCol, InviteOrigin.ADMIN_INVITED),
      eq(statusCol, InviteStatus.VOLUNTEER_ACCEPTED),
    ),
    and(
      eq(originCol, InviteOrigin.VOLUNTEER_APPLIED),
      eq(statusCol, InviteStatus.ADMIN_ACCEPTED),
    ),
    and(
      eq(originCol, InviteOrigin.ADMIN_INVITED),
      eq(statusCol, InviteStatus.ADMIN_ACCEPTED),
    ),
  ) as SQL;
}

export function outstandingInviteSql(
  originCol: AnyPgColumn,
  statusCol: AnyPgColumn,
): SQL {
  return and(
    eq(originCol, InviteOrigin.ADMIN_INVITED),
    isNull(statusCol),
  ) as SQL;
}

export function activeInviteSql(
  originCol: AnyPgColumn,
  statusCol: AnyPgColumn,
): SQL {
  return or(
    participatingInviteSql(originCol, statusCol),
    outstandingInviteSql(originCol, statusCol),
  ) as SQL;
}

export function adminEndedInviteSql(statusCol: AnyPgColumn): SQL {
  return or(
    eq(statusCol, InviteStatus.ADMIN_REJECTED),
    eq(statusCol, InviteStatus.ADMIN_CANCELLED),
  ) as SQL;
}

/** RQ `where` for my-list queries: waiting, explicit answers, or participating default. */
export function myInviteFilterWhere(
  statuses?: readonly InviteStatusValue[] | null,
  waiting?: boolean | null,
): Record<string, unknown> {
  if (waiting) {
    return { ...OUTSTANDING_INVITE_WHERE };
  }
  if (statuses != null && statuses.length > 0) {
    return { status: { in: [...statuses] } };
  }
  return { ...PARTICIPATING_INVITE_WHERE };
}

export function isAdminOnlyInviteTarget(
  status: InviteStatusValue | undefined,
): boolean {
  return status == null || isAdminEndedInvite(status);
}
