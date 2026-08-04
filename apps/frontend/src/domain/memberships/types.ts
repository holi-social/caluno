export type MembershipCardOrgUnit = {
  id: string;
  name: string;
  logoUrl?: string | null;
  typeIcon: string;
  isRoot: boolean;
};

export type MembershipEntry =
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
// VOLI-942 will add: | { state: 'accepted'; id: string; organizationName: string; orgUnit: MembershipCardOrgUnit; role?: string; date: Date }
