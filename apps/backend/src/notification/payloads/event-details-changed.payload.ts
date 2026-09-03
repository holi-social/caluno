import type { ChangedField } from './shift-details-changed.payload';

export interface EventDetailsChangedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  eventId: string;
  eventTitle: string;
  recipientUserIds: string[];
  changes: ChangedField[];
}
