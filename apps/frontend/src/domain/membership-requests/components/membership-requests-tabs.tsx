'use client';

import {
  type GetMembershipRequestsQuery,
  MembershipRequestStatus,
} from '@repo/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MembershipRequestCard from './membership-request-card';

type MembershipRequestItem =
  GetMembershipRequestsQuery['membershipRequests']['items'][number];

interface MembershipRequestsTabsProps {
  activeStatus: string;
  membershipRequests: MembershipRequestItem[];
}

const renderMembershipRequestGroup = (
  requests: MembershipRequestItem[],
  status: MembershipRequestStatus,
) => {
  const requestsByStatus = requests.filter(
    (request) => request.status === status,
  );

  if (requestsByStatus.length === 0) {
    return <p className="text-muted-foreground">No membership requests yet.</p>;
  } else {
    return requestsByStatus.map((request) => (
      <MembershipRequestCard key={request.id} request={request} />
    ));
  }
};

export function MembershipRequestsTabs({
  activeStatus,
  membershipRequests = [],
}: MembershipRequestsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeStatus} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value={MembershipRequestStatus.Pending}>
          Pending
        </TabsTrigger>

        <TabsTrigger value={MembershipRequestStatus.Accepted}>
          Approved
        </TabsTrigger>

        <TabsTrigger value={MembershipRequestStatus.Rejected}>
          Rejected
        </TabsTrigger>
      </TabsList>

      <TabsContent value={MembershipRequestStatus.Pending}>
        <div className="flex flex-col gap-4">
          {renderMembershipRequestGroup(
            membershipRequests,
            MembershipRequestStatus.Pending,
          )}
        </div>
      </TabsContent>

      <TabsContent value={MembershipRequestStatus.Accepted}>
        <div className="flex flex-col gap-4">
          {renderMembershipRequestGroup(
            membershipRequests,
            MembershipRequestStatus.Accepted,
          )}
        </div>
      </TabsContent>

      <TabsContent value={MembershipRequestStatus.Rejected}>
        <div className="flex flex-col gap-4">
          {renderMembershipRequestGroup(
            membershipRequests,
            MembershipRequestStatus.Rejected,
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
