export interface ShiftInstanceCancelledPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientUserIds: string[];
  startsAt: Date;
  endsAt: Date;
  instanceId: string;
}
