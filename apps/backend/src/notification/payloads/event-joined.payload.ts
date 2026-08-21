export interface EventJoinedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  eventTitle: string;
  joinedUserId: string;
  recipientUserIds: string[];
  startsAt: Date;
}
