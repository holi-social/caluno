'use client';

import type { GetMembershipRequestsQuery } from '@repo/data';
import MembershipRequestCard from '@/domain/membership-requests/components/membership-request-card';
import { MembershipRequestsTabs } from '@/domain/membership-requests/components/membership-requests-tabs';

type MembershipRequestItem =
  GetMembershipRequestsQuery['membershipRequests']['items'][number];

interface Props {
  activeStatus: string;
  membershipRequests: MembershipRequestItem[];
}

export default function Tabs({ activeStatus, membershipRequests }: Props) {
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
