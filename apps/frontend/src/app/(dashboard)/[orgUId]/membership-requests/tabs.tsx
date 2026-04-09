'use client';

import type { GetMembershipRequestsQuery } from '@repo/data';
import MembershipRequestCard from '@/domain/membership-requests/components/membership-request-card';
import { MembershipRequestsTabs } from '@/domain/membership-requests/components/membership-requests-tabs';

type MembershipRequestItem =
  GetMembershipRequestsQuery['membershipRequests']['items'][number];

interface Props<T> {
  activeStatus: string;
  membershipRequests: MembershipRequestItem[];
}

export default function Tabs<T>({
  activeStatus,
  membershipRequests,
}: Props<T>) {
  return (
    <MembershipRequestsTabs
      activeStatus={activeStatus}
      membershipRequests={membershipRequests}
      renderItem={(request) => (
        <MembershipRequestCard key={request.id} request={request} />
      )}
    />
  );
}
