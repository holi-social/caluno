export interface MembershipRejectedPayload {
  organizationUnitId: string;
  organizationName: string;
  userId: string;
  rejectionReason: string | null;
}
