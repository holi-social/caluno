import { NotificationEvent } from './notification-events';
import type { MembershipApprovedPayload } from './payloads/membership-approved.payload';
import type { MembershipRequestedPayload } from './payloads/membership-requested.payload';
import type { OrganizationCreatedPayload } from './payloads/organization-created.payload';
import type { ShiftInstanceCancelledPayload } from './payloads/shift-instance-cancelled.payload';
import type { ShiftInstanceInvitedPayload } from './payloads/shift-instance-invited.payload';
import type { ShiftInstanceJoinedPayload } from './payloads/shift-instance-joined.payload';
import type { ShiftInstanceSeriesCancelledPayload } from './payloads/shift-instance-series-cancelled.payload';
import type { ShiftInvitedPayload } from './payloads/shift-invited.payload';

export interface NotificationEventPayloadMap {
  [NotificationEvent.ORGANIZATION_CREATED]: OrganizationCreatedPayload;
  [NotificationEvent.MEMBERSHIP_REQUESTED]: MembershipRequestedPayload;
  [NotificationEvent.MEMBERSHIP_APPROVED]: MembershipApprovedPayload;
  [NotificationEvent.SHIFT_INSTANCE_JOINED]: ShiftInstanceJoinedPayload;
  [NotificationEvent.SHIFT_INSTANCE_INVITED]: ShiftInstanceInvitedPayload;
  [NotificationEvent.SHIFT_INSTANCE_CANCELLED]: ShiftInstanceCancelledPayload;
  [NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED]: ShiftInstanceSeriesCancelledPayload;
  [NotificationEvent.SHIFT_INVITED]: ShiftInvitedPayload;
}
