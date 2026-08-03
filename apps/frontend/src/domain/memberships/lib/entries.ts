import { MembershipRequestStatus } from '@repo/data';
import type { MembershipCardOrgUnit, MembershipEntry } from '../types';

type MyRequestItem = {
  id: string;
  status: MembershipRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  organizationUnit: {
    id: string;
    name: string;
    logoUrl?: string | null;
    type: { icon: string };
    parent?: { id: string } | null;
    organization: { name: string };
  };
};

const STATE_ORDER: Record<MembershipEntry['state'], number> = {
  requested: 0,
  declined: 1,
};

const toOrgUnit = (
  orgUnit: MyRequestItem['organizationUnit'],
): MembershipCardOrgUnit => ({
  id: orgUnit.id,
  name: orgUnit.name,
  logoUrl: orgUnit.logoUrl,
  typeIcon: orgUnit.type.icon,
  isRoot: !orgUnit.parent,
});

export function buildMembershipEntries(
  requests: MyRequestItem[],
): MembershipEntry[] {
  const entries: MembershipEntry[] = [];
  for (const request of requests) {
    const orgUnit = request.organizationUnit;
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
      });
    }
    // ACCEPTED / CANCELLED are excluded by the backend filter and ignored here.
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
