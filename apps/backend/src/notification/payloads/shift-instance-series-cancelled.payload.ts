export interface ShiftInstanceSeriesCancelledPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientUserIds: string[];
  fromDate: Date;
}
