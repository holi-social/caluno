import { NotificationEvent } from './notification-events';
import type { OrganizationCreatedPayload } from './payloads/organization-created.payload';

export interface NotificationEventPayloadMap {
  [NotificationEvent.ORGANIZATION_CREATED]: OrganizationCreatedPayload;
}
