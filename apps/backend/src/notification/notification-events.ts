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
  SHIFT_INVITED: 'notification.shift.invited',
  EVENT_INVITED: 'notification.event.invited',
  EVENT_JOINED: 'notification.event.joined',
  EVENT_CANCELLED: 'notification.event.cancelled',
  // The volunteer is only ever told about the two things that ask something
  // of them (or take something away): a document waiting for their signature,
  // and the organisation declining a document they had already signed.
  // Generation and final countersignature settle quietly — see
  // accounting-volunteer-documents.
  DOCUMENT_AWAITING_SIGNATURE: 'notification.document.awaiting-signature',
  DOCUMENT_DECLINED_BY_ORG: 'notification.document.declined-by-org',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
