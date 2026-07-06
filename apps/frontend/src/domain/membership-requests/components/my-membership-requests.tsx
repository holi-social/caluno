import type { GetMyMembershipRequestsQuery } from '@repo/data';
import MyMembershipRequestCard from '@/domain/membership-requests/components/my-membership-request-card';

type MyMembershipRequestItem =
  GetMyMembershipRequestsQuery['myMembershipRequests']['items'][number];

interface Props {
  membershipRequests: MyMembershipRequestItem[];
}

const MyMembershipRequests = ({ membershipRequests }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2">
    {membershipRequests.map((m) => (
      <MyMembershipRequestCard key={m.id} request={m} />
    ))}
  </div>
);

export default MyMembershipRequests;
