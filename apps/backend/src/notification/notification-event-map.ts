import { NotificationEvent } from './notification-events';
import type { MembershipApprovedPayload } from './payloads/membership-approved.payload';
import type { MembershipRequestedPayload } from './payloads/membership-requested.payload';
import type { OrganizationCreatedPayload } from './payloads/organization-created.payload';
import type { ShiftInstanceInvitedPayload } from './payloads/shift-instance-invited.payload';
import type { ShiftInstanceJoinedPayload } from './payloads/shift-instance-joined.payload';
import type { ShiftInvitedPayload } from './payloads/shift-invited.payload';
import type { UserEmailVerifiedPayload } from './payloads/user-email-verified.payload';

export interface NotificationEventPayloadMap {
  [NotificationEvent.ORGANIZATION_CREATED]: OrganizationCreatedPayload;
  [NotificationEvent.MEMBERSHIP_REQUESTED]: MembershipRequestedPayload;
  [NotificationEvent.MEMBERSHIP_APPROVED]: MembershipApprovedPayload;
  [NotificationEvent.SHIFT_INSTANCE_JOINED]: ShiftInstanceJoinedPayload;
  [NotificationEvent.SHIFT_INSTANCE_INVITED]: ShiftInstanceInvitedPayload;
  [NotificationEvent.SHIFT_INVITED]: ShiftInvitedPayload;
  [NotificationEvent.USER_EMAIL_VERIFIED]: UserEmailVerifiedPayload;
}
