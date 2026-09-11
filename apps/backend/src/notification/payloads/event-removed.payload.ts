export interface EventRemovedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  eventId: string;
  eventTitle: string;
  eventLocation?: string | null;
  userId: string;
  startsAt: Date;
  endsAt: Date;
}
