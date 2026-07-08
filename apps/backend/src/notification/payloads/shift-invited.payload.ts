import type { ShiftInviteSchedule } from '../shift-invite-schedule';

export interface ShiftInvitedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  shiftInstructions?: string | null;
  recipientUserIds: string[];
  schedule: ShiftInviteSchedule;
}
