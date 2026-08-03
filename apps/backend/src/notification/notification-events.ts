export const NotificationEvent = {
  ORGANIZATION_CREATED: 'notification.organization.created',
  MEMBERSHIP_REQUESTED: 'notification.membership.requested',
  MEMBERSHIP_APPROVED: 'notification.membership.approved',
  SHIFT_INSTANCE_JOINED: 'notification.shift-instance.joined',
  SHIFT_INSTANCE_INVITED: 'notification.shift-instance.invited',
  SHIFT_INVITED: 'notification.shift.invited',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
