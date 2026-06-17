export const NotificationEvent = {
  ORGANIZATION_CREATED: 'notification.organization.created',
  MEMBERSHIP_APPROVED: 'notification.membership.approved',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
