import { MembershipRequestStatus } from '@repo/data';
import type { MembershipEntry, MembershipCardOrg } from '../types';

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
      entries.push({ state: 'requested', id: request.id, org, date: request.createdAt });
    } else if (request.status === MembershipRequestStatus.Rejected) {
      entries.push({ state: 'declined', id: request.id, org, date: request.reviewedAt ?? request.createdAt });
    }
    // ACCEPTED / CANCELLED are excluded by the backend filter and ignored here.
  }
  return sortMembershipEntries(entries);
}

export function sortMembershipEntries(entries: MembershipEntry[]): MembershipEntry[] {
  return [...entries].sort((a, b) => {
    const byState = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (byState !== 0) return byState;
    return Date.parse(b.date) - Date.parse(a.date);
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

export function formatMembershipDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}
