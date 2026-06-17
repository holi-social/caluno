export interface MembershipRequestedRecipient {
  email: string;
  firstName: string;
}

export interface MembershipRequestedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  requesterName: string;
  recipients: MembershipRequestedRecipient[];
}
