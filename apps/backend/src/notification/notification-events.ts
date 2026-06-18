export const NotificationEvent = {
  ORGANIZATION_CREATED: 'notification.organization.created',
  MEMBERSHIP_REQUESTED: 'notification.membership.requested',
  MEMBERSHIP_APPROVED: 'notification.membership.approved',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
