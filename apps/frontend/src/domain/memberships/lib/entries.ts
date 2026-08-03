import { MembershipRequestStatus } from '@repo/data';
import type { MembershipCardOrg, MembershipEntry } from '../types';

type MyRequestItem = {
  id: string;
  status: MembershipRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  organizationUnit: MembershipCardOrg;
};

const STATE_ORDER: Record<MembershipEntry['state'], number> = {
  requested: 0,
  declined: 1,
};

export function buildMembershipEntries(
  requests: MyRequestItem[],
): MembershipEntry[] {
  const entries: MembershipEntry[] = [];
  for (const request of requests) {
    const org = request.organizationUnit;
    if (request.status === MembershipRequestStatus.Pending) {
      entries.push({
        state: 'requested',
        id: request.id,
        org,
        date: new Date(request.createdAt),
      });
    } else if (request.status === MembershipRequestStatus.Rejected) {
      entries.push({
        state: 'declined',
        id: request.id,
        org,
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

export function orgInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}
