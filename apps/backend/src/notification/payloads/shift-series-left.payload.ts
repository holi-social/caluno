export interface ShiftSeriesLeftPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  userId: string;
  fromDate: Date;
}
