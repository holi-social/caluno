import { NotificationEvent } from './notification-events';
import type { MembershipApprovedPayload } from './payloads/membership-approved.payload';
import type { OrganizationCreatedPayload } from './payloads/organization-created.payload';

export interface NotificationEventPayloadMap {
  [NotificationEvent.ORGANIZATION_CREATED]: OrganizationCreatedPayload;
  [NotificationEvent.MEMBERSHIP_APPROVED]: MembershipApprovedPayload;
}
