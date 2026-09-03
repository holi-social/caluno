export interface ShiftInstanceLeftPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  userId: string;
  startsAt: Date;
  endsAt: Date;
}
