export interface ShiftInstanceWaitlistSpotOpenedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  instanceId: string;
  startsAt: Date;
  endsAt: Date;
  recipientUserIds: string[];
}
