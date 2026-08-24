export interface EventCancelledPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  eventTitle: string;
  eventLocation?: string | null;
  recipientUserIds: string[];
  startsAt: Date;
  endsAt: Date;
}
