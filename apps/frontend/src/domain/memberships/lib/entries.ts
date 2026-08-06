import { MembershipRequestStatus } from '@repo/data';
import type { MembershipCardOrgUnit, MembershipEntry } from '../types';

type OrgUnitInput = {
  id: string;
  name: string;
  logoUrl?: string | null;
  type: { icon: string };
  parent?: { id: string } | null;
  organization: { name: string };
};

type MyRequestItem = {
  id: string;
  status: MembershipRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  organizationUnit: OrgUnitInput;
};

type MyMembershipItem = {
  id: string;
  createdAt: string;
  roles: { id: string; name: string }[];
  organizationUnit: OrgUnitInput;
};

const STATE_ORDER: Record<MembershipEntry['state'], number> = {
  accepted: 0,
  requested: 1,
  declined: 2,
};

const toOrgUnit = (orgUnit: OrgUnitInput): MembershipCardOrgUnit => ({
  id: orgUnit.id,
  name: orgUnit.name,
  logoUrl: orgUnit.logoUrl,
  typeIcon: orgUnit.type.icon,
  isRoot: !orgUnit.parent,
});

export function buildMembershipEntries(
  requests: MyRequestItem[],
  memberships: MyMembershipItem[],
): MembershipEntry[] {
  const entries: MembershipEntry[] = [];
  const memberOrgUnitIds = new Set<string>();

  // Memberships are the source of truth for the accepted state.
  for (const membership of memberships) {
    const orgUnit = membership.organizationUnit;
    memberOrgUnitIds.add(orgUnit.id);
    entries.push({
      state: 'accepted',
      id: membership.id,
      organizationName: orgUnit.organization.name,
      orgUnit: toOrgUnit(orgUnit),
      roles: membership.roles.map((role) => role.name),
      date: new Date(membership.createdAt),
    });
  }

  for (const request of requests) {
    const orgUnit = request.organizationUnit;
    // Accepted/cancelled requests are ignored — memberships are master.
    if (
      request.status === MembershipRequestStatus.Accepted ||
      request.status === MembershipRequestStatus.Cancelled
    ) {
      continue;
    }
    // A membership already covers this org unit; don't double-show.
    if (memberOrgUnitIds.has(orgUnit.id)) {
      continue;
    }
    if (request.status === MembershipRequestStatus.Pending) {
      entries.push({
        state: 'requested',
        id: request.id,
        organizationName: orgUnit.organization.name,
        orgUnit: toOrgUnit(orgUnit),
        date: new Date(request.createdAt),
      });
    } else if (request.status === MembershipRequestStatus.Rejected) {
      entries.push({
        state: 'declined',
        id: request.id,
        organizationName: orgUnit.organization.name,
        orgUnit: toOrgUnit(orgUnit),
        date: new Date(request.reviewedAt ?? request.createdAt),
        rejectionReason: request.rejectionReason,
      });
    }
  }

  return sortMembershipEntries(entries);
}

export function sortMembershipEntries(
  entries: MembershipEntry[],
): MembershipEntry[] {
  return [...entries].sort((a, b) => {
    const byState = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (byState !== 0) return byState;
    return b.date.getTime() - a.date.getTime();
  });
}
