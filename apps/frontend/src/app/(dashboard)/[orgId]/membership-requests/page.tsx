import { MembershipRequestStatus } from '@repo/data';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { getDataClient } from '@/lib/data-client';
import { formatDate } from '@/lib/formatting';
import { requireOrgAccess } from '@/lib/org-context-server';
import { MembershipRequestActions } from './membership-request-actions';

interface Props {
  params: Promise<{ orgId: string }>;
}

export default async function MembershipRequestsPage({ params }: Props) {
  const { orgId } = await params;

  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient(org.id);

  const membershipRequests =
    await data.membershipRequest.findAllByOrganizationId(org.id, {
      status: MembershipRequestStatus.Pending,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteers</h1>
        <p className="text-muted-foreground mt-1">
          Manage membership requests in your organization
        </p>
      </div>

      {membershipRequests.items.length === 0 ? (
        <p className="text-muted-foreground">No membership requests yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {membershipRequests.items.map((request) => (
            <Card key={request.id} className="w-full">
              <CardHeader className="flex flex-row gap-3 ">
                <div className="width-full flex flex-col gap-3">
                  <CardTitle className="truncate">
                    {request.user.name}
                  </CardTitle>

                  <CardDescription className="truncate">
                    {request.user.email}
                  </CardDescription>
                </div>

                <div className="w-full flex justify-end items-center">
                  <CardAction>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(new Date(request.createdAt))}
                    </p>
                  </CardAction>
                </div>
              </CardHeader>

              <CardContent className="flex justify-end">
                <MembershipRequestActions
                  id={request.id}
                  organizationId={org.id}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
