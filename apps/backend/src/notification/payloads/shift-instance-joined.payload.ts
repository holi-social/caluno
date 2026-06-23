export interface ShiftInstanceJoinedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftTitle: string;
  joinedUserId: string;
  recipientUserIds: string[];
  startsAt: Date;
}
