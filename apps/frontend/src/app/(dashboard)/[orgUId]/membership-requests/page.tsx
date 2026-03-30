import { MembershipRequestStatus } from '@repo/data';

import { MembershipRequestsTabs } from '@/domain/membership-requests/components/membership-requests-tabs';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_MAP: Record<string, MembershipRequestStatus> = {
  [MembershipRequestStatus.Accepted]: MembershipRequestStatus.Accepted,
  [MembershipRequestStatus.Rejected]: MembershipRequestStatus.Rejected,
  [MembershipRequestStatus.Pending]: MembershipRequestStatus.Pending,
};

export default async function MembershipRequestsPage({
  params,
  searchParams,
}: Props) {
  const { orgUId } = await params;
  const { status: statusParam = '' } = await searchParams;

  const status = STATUS_MAP[statusParam] ?? MembershipRequestStatus.Pending;

  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const { items: membershipRequests } =
    await data.membershipRequest.findAllByOrganizationUnitId(orgUId, { status });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Volunteers</h1>

        <p className="text-muted-foreground mt-1">
          Manage membership requests in your organization
        </p>
      </div>

      <MembershipRequestsTabs
        membershipRequests={membershipRequests}
        activeStatus={status}
      />
    </div>
  );
}
