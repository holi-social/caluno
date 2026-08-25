/** Canonical invite origin — how the person arrived. Set on insert; unchanged except re-invite. */
export enum InviteOrigin {
  ADMIN_INVITED = 'ADMIN_INVITED',
  VOLUNTEER_JOINED = 'VOLUNTEER_JOINED',
  VOLUNTEER_APPLIED = 'VOLUNTEER_APPLIED',
}

/** Canonical invite answer. Null on the row means still waiting. */
export enum InviteStatus {
  VOLUNTEER_ACCEPTED = 'VOLUNTEER_ACCEPTED',
  VOLUNTEER_REJECTED = 'VOLUNTEER_REJECTED',
  ADMIN_ACCEPTED = 'ADMIN_ACCEPTED',
  ADMIN_REJECTED = 'ADMIN_REJECTED',
  VOLUNTEER_CANCELLED = 'VOLUNTEER_CANCELLED',
  ADMIN_CANCELLED = 'ADMIN_CANCELLED',
}

export type InviteOriginValue = `${InviteOrigin}` | null;
export type InviteStatusValue = `${InviteStatus}` | null;
