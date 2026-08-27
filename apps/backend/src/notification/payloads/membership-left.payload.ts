export interface MembershipLeftPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  leaverUserId: string;
  recipientUserIds: string[];
}
