import { MembershipRequestStatus } from '@repo/data';

import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import Tabs from './tabs';

const VALID_STATUSES = [
  MembershipRequestStatus.Pending,
  MembershipRequestStatus.Accepted,
  MembershipRequestStatus.Rejected,
] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

interface Props {
  params: Promise<{ orgUId: string }>;
  searchParams: Promise<{ status?: ValidStatus }>;
}

export default async function MembershipRequestsPage({
  params,
  searchParams,
}: Props) {
  const { orgUId } = await params;
  const { status: statusParam } = await searchParams;
  const status =
    statusParam && VALID_STATUSES.includes(statusParam)
      ? statusParam
      : MembershipRequestStatus.Pending;

  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const { items: membershipRequests } =
    await data.membershipRequest.findAllByOrganizationUnitId(orgUId, {
      status,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Volunteers</h1>

        <p className="text-muted-foreground mt-1">
          Manage membership requests in your organization
        </p>
      </div>

      <Tabs activeStatus={status} membershipRequests={membershipRequests} />
    </div>
  );
}
