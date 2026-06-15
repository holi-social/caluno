export const NotificationEvent = {
  ORGANIZATION_CREATED: 'notification.organization.created',
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
