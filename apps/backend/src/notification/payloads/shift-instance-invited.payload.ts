export interface ShiftInstanceInvitedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  shiftInstructions?: string | null;
  recipientUserIds: string[];
  startsAt: Date;
  endsAt: Date;
  instanceId: string;
}
