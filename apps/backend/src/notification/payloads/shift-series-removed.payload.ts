export interface ShiftSeriesRemovedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  userId: string;
  fromDate: Date;
}
