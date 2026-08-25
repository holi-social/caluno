export type MembershipCardOrgUnit = {
  id: string;
  name: string;
  logoUrl?: string | null;
  typeIcon: string;
  isRoot: boolean;
};

export type MembershipEntry =
  | {
      state: 'accepted';
      id: string;
      organizationName: string;
      orgUnit: MembershipCardOrgUnit;
      roles: string[];
      date: Date;
    }
  | {
      state: 'requested';
      id: string;
      organizationName: string;
      orgUnit: MembershipCardOrgUnit;
      date: Date;
    }
  | {
      state: 'declined';
      id: string;
      organizationName: string;
      orgUnit: MembershipCardOrgUnit;
      date: Date;
      rejectionReason?: string | null;
    };
