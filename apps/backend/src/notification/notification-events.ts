export const NotificationEvent = {
  ORGANIZATION_CREATED: 'notification.organization.created',
  MEMBERSHIP_REQUESTED: 'notification.membership.requested',
  MEMBERSHIP_APPROVED: 'notification.membership.approved',
  MEMBERSHIP_LEFT: 'notification.membership.left',
  MEMBERSHIP_REMOVED: 'notification.membership.removed',
  MEMBERSHIP_REJECTED: 'notification.membership.rejected',
  SHIFT_INSTANCE_JOINED: 'notification.shift-instance.joined',
  SHIFT_INSTANCE_INVITED: 'notification.shift-instance.invited',
  SHIFT_INSTANCE_CANCELLED: 'notification.shift-instance.cancelled',
  SHIFT_INSTANCE_SERIES_CANCELLED:
    'notification.shift-instance.series-cancelled',
  SHIFT_INSTANCE_REMOVED: 'notification.shift-instance.removed',
  SHIFT_SERIES_REMOVED: 'notification.shift.series-removed',
  SHIFT_INSTANCE_LEFT: 'notification.shift-instance.left',
  SHIFT_SERIES_LEFT: 'notification.shift.series-left',
  SHIFT_INSTANCE_VOLUNTEER_LEFT: 'notification.shift-instance.volunteer-left',
  SHIFT_SERIES_VOLUNTEER_LEFT: 'notification.shift.series-volunteer-left',
  SHIFT_DETAILS_CHANGED: 'notification.shift.details-changed',
  SHIFT_INVITED: 'notification.shift.invited',
  // These two aren't routed through the emitter/listener like the events
  // above — the call-out mutation needs each send's outcome synchronously to
  // persist a per-recipient delivery record, so it calls EmailService
  // directly. The event constants exist only to label the
  // resolveUsersNotificationData "user not found" warning.
  SHIFT_INSTANCE_CALL_OUT: 'notification.shift-instance.call-out',
  SHIFT_INSTANCE_CALL_OUT_NO_RECIPIENTS:
    'notification.shift-instance.call-out-no-recipients',
  EVENT_INVITED: 'notification.event.invited',
  EVENT_JOINED: 'notification.event.joined',
  EVENT_CANCELLED: 'notification.event.cancelled',
  EVENT_REMOVED: 'notification.event.removed',
  EVENT_DETAILS_CHANGED: 'notification.event.details-changed',
  // The volunteer is only ever told about the two things that ask something
  // of them (or take something away): a document waiting for their signature,
  // and the organisation declining a document they had already signed.
  // Generation and final countersignature settle quietly — see
  // accounting-volunteer-documents.
  DOCUMENT_AWAITING_SIGNATURE: 'notification.document.awaiting-signature',
  DOCUMENT_DECLINED_BY_ORG: 'notification.document.declined-by-org',
  // The admin-facing counterpart: the volunteer declined a document with a
  // reason, and whoever can correct and reissue it needs to know (VOLI-1246).
  DOCUMENT_DECLINED_BY_VOLUNTEER: 'notification.document.declined-by-volunteer',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
