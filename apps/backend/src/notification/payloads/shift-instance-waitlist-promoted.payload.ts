export interface ShiftInstanceWaitlistPromotedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  userId: string;
  startsAt: Date;
  endsAt: Date;
  instanceId: string;
}
