import { JoinStatus } from '../../shared/enums/join-status.enum';

export enum EventInviteStatus {
  ADMIN_INVITED = 'ADMIN_INVITED',
  AWAITING_ADMIN_APPROVAL = 'AWAITING_ADMIN_APPROVAL',
  WAITLIST_JOINED = 'WAITLIST_JOINED',
  JOINED = 'JOINED',
  VOLUNTEER_REJECTED = 'VOLUNTEER_REJECTED',
  VOLUNTEER_CANCELLED = 'VOLUNTEER_CANCELLED',
  ADMIN_REJECTED = 'ADMIN_REJECTED',
}

export const INVITE_STATUS_TO_JOIN_EVENT_STATUS: Record<
  EventInviteStatus,
  JoinStatus
> = {
  [EventInviteStatus.ADMIN_INVITED]: JoinStatus.INVITED,
  [EventInviteStatus.AWAITING_ADMIN_APPROVAL]: JoinStatus.PENDING,
  [EventInviteStatus.WAITLIST_JOINED]: JoinStatus.WAITLIST_JOINED,
  [EventInviteStatus.JOINED]: JoinStatus.JOINED,
  [EventInviteStatus.VOLUNTEER_REJECTED]: JoinStatus.VOLUNTEER_REJECTED,
  [EventInviteStatus.VOLUNTEER_CANCELLED]: JoinStatus.VOLUNTEER_REJECTED,
  [EventInviteStatus.ADMIN_REJECTED]: JoinStatus.REJECTED,
};
