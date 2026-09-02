import { NotificationEvent } from './notification-events';
import type { DocumentAwaitingSignaturePayload } from './payloads/document-awaiting-signature.payload';
import type { DocumentDeclinedByOrgPayload } from './payloads/document-declined-by-org.payload';
import type { EventCancelledPayload } from './payloads/event-cancelled.payload';
import type { EventInvitedPayload } from './payloads/event-invited.payload';
import type { EventJoinedPayload } from './payloads/event-joined.payload';
import type { MembershipApprovedPayload } from './payloads/membership-approved.payload';
import type { MembershipLeftPayload } from './payloads/membership-left.payload';
import type { MembershipRemovedPayload } from './payloads/membership-removed.payload';
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
  [NotificationEvent.MEMBERSHIP_LEFT]: MembershipLeftPayload;
  [NotificationEvent.MEMBERSHIP_REMOVED]: MembershipRemovedPayload;
  [NotificationEvent.SHIFT_INSTANCE_JOINED]: ShiftInstanceJoinedPayload;
  [NotificationEvent.SHIFT_INSTANCE_INVITED]: ShiftInstanceInvitedPayload;
  [NotificationEvent.SHIFT_INSTANCE_CANCELLED]: ShiftInstanceCancelledPayload;
  [NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED]: ShiftInstanceSeriesCancelledPayload;
  [NotificationEvent.SHIFT_INVITED]: ShiftInvitedPayload;
  [NotificationEvent.EVENT_INVITED]: EventInvitedPayload;
  [NotificationEvent.EVENT_JOINED]: EventJoinedPayload;
  [NotificationEvent.EVENT_CANCELLED]: EventCancelledPayload;
  [NotificationEvent.DOCUMENT_AWAITING_SIGNATURE]: DocumentAwaitingSignaturePayload;
  [NotificationEvent.DOCUMENT_DECLINED_BY_ORG]: DocumentDeclinedByOrgPayload;
}
