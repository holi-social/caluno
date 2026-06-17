export interface MembershipRequestedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  requesterUserId: string;
  recipientUserIds: string[];
}
