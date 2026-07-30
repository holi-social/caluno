export type MembershipCardOrg = { id: string; name: string };

export type MembershipEntry =
  | { state: 'requested'; id: string; org: MembershipCardOrg; date: string }
  | { state: 'declined'; id: string; org: MembershipCardOrg; date: string };
// VOLI-942 will add: | { state: 'accepted'; id: string; org: MembershipCardOrg; role?: string; date: string }
