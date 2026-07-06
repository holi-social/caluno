'use client';

import type { GetMyMembershipRequestsQuery } from '@repo/data';
import { MembershipRequestsTabs } from '@/domain/membership-requests/components/membership-requests-tabs';
import MyMembershipRequestCard from '@/domain/membership-requests/components/my-membership-request-card';

type MyMembershipRequestItem =
  GetMyMembershipRequestsQuery['myMembershipRequests']['items'][number];

interface Props {
  activeStatus: string;
  membershipRequests: MyMembershipRequestItem[];
}

export default function MyMembershipRequests({
  activeStatus,
  membershipRequests,
}: Props) {
  return (
    <MembershipRequestsTabs
      activeStatus={activeStatus}
      membershipRequests={membershipRequests}
      renderItem={(request) => (
        <MyMembershipRequestCard key={request.id} request={request} />
      )}
    />
  );
}
