export interface ShiftSeriesVolunteerLeftPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  volunteerUserId: string;
  volunteerName: string;
  recipientUserIds: string[];
  fromDate: Date;
  signedUpCount: number;
  minVolunteers: number | null;
}
