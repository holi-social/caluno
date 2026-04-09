import { MembershipRequestStatus } from '@repo/data';
import { getDataClient } from '@/lib/data-client';
import Tabs from './tabs';

const VALID_STATUSES = [
  MembershipRequestStatus.Pending,
  MembershipRequestStatus.Accepted,
  MembershipRequestStatus.Rejected,
] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

interface Props {
  searchParams: Promise<{ status?: ValidStatus }>;
}

export default async function MyMembershipRequestsPage({
  searchParams,
}: Props) {
  const { status: statusParam } = await searchParams;
  const status =
    statusParam && VALID_STATUSES.includes(statusParam)
      ? statusParam
      : MembershipRequestStatus.Pending;

  const data = await getDataClient();
  const { items: membershipRequests } = await data.membershipRequest.findMine({
    status,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Membership Requests</h1>
        <p className="text-muted-foreground mt-1">
          Your requests to join organizations
        </p>
      </div>

      <Tabs activeStatus={status} membershipRequests={membershipRequests} />
    </div>
  );
}
