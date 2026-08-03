export type MembershipCardOrg = { id: string; name: string };

export type MembershipEntry =
  | { state: 'requested'; id: string; org: MembershipCardOrg; date: Date }
  | { state: 'declined'; id: string; org: MembershipCardOrg; date: Date };
// VOLI-942 will add: | { state: 'accepted'; id: string; org: MembershipCardOrg; role?: string; date: Date }
