'use client';

import { MembershipRequestStatus } from '@repo/data';
import { QueryParamTabs } from '@/components/query-param-tabs';

interface Props<T> {
  activeStatus: string;
  membershipRequests: T[];
  renderItem: (item: T) => React.ReactNode;
}

const TABS = [
  { value: MembershipRequestStatus.Pending, label: 'Pending' },
  { value: MembershipRequestStatus.Accepted, label: 'Approved' },
  { value: MembershipRequestStatus.Rejected, label: 'Rejected' },
];

export function MembershipRequestsTabs<
  T extends { id: string; status: MembershipRequestStatus },
>({ activeStatus, membershipRequests = [], renderItem }: Props<T>) {
  const tabs = TABS.map((tab) => ({
    ...tab,
    items: membershipRequests.filter((r) => r.status === tab.value),
  }));

  return (
    <QueryParamTabs
      tabs={tabs}
      activeTab={activeStatus}
      searchParamName="status"
      renderItem={renderItem}
      emptyMessage="No membership requests yet."
    />
  );
}
