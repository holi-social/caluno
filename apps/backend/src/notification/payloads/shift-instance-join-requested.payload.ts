export interface ShiftInstanceJoinRequestedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  instanceId: string;
  requesterUserId: string;
  recipientUserIds: string[];
  startsAt: Date;
}
