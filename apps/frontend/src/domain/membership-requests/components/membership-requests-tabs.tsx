'use client';

import { MembershipRequestStatus } from '@repo/data';
import { useTranslations } from 'next-intl';
import { QueryParamTabs } from '@/components/query-param-tabs';

interface Props<T> {
  activeStatus: string;
  membershipRequests: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function MembershipRequestsTabs<
  T extends { id: string; status: MembershipRequestStatus },
>({ activeStatus, membershipRequests = [], renderItem }: Props<T>) {
  const t = useTranslations('MembershipRequest');
  const tabs = [
    {
      value: MembershipRequestStatus.Pending,
      label: t('status.pending'),
    },
    {
      value: MembershipRequestStatus.Accepted,
      label: t('status.approved'),
    },
    {
      value: MembershipRequestStatus.Rejected,
      label: t('status.rejected'),
    },
  ].map((tab) => ({
    ...tab,
    items: membershipRequests.filter((r) => r.status === tab.value),
  }));

  return (
    <QueryParamTabs
      tabs={tabs}
      activeTab={activeStatus}
      searchParamName="status"
      renderItem={renderItem}
      emptyMessage={t('empty')}
    />
  );
}
