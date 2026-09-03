export const NotificationEvent = {
  ORGANIZATION_CREATED: 'notification.organization.created',
  MEMBERSHIP_REQUESTED: 'notification.membership.requested',
  MEMBERSHIP_APPROVED: 'notification.membership.approved',
  MEMBERSHIP_LEFT: 'notification.membership.left',
  MEMBERSHIP_REMOVED: 'notification.membership.removed',
  SHIFT_INSTANCE_JOINED: 'notification.shift-instance.joined',
  SHIFT_INSTANCE_INVITED: 'notification.shift-instance.invited',
  SHIFT_INSTANCE_CANCELLED: 'notification.shift-instance.cancelled',
  SHIFT_INSTANCE_SERIES_CANCELLED:
    'notification.shift-instance.series-cancelled',
  SHIFT_INVITED: 'notification.shift.invited',
  EVENT_INVITED: 'notification.event.invited',
  EVENT_JOINED: 'notification.event.joined',
  EVENT_CANCELLED: 'notification.event.cancelled',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
