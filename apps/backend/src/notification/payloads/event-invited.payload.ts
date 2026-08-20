export interface EventInvitedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  eventId: string;
  eventTitle: string;
  eventLocation?: string | null;
  recipientUserIds: string[];
  startsAt: Date;
  endsAt: Date;
}
