export interface ShiftInstanceVolunteerLeftPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  volunteerUserId: string;
  volunteerName: string;
  recipientUserIds: string[];
  startsAt: Date;
  endsAt: Date;
  signedUpCount: number;
  minVolunteers: number | null;
}
