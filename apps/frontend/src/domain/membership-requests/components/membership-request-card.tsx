import {
  type GetMembershipRequestsQuery,
  MembershipRequestStatus,
} from '@repo/data';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { MembershipRequestActions } from '@/domain/membership-requests/components/membership-request-actions';
import { formatDate } from '@/lib/formatting';

interface Props {
  request: GetMembershipRequestsQuery['membershipRequests']['items'][number];
}

export default function MembershipRequestCard({ request }: Props) {
  return (
    <Card key={request.id} className="w-full">
      <CardHeader className="flex flex-row gap-3 ">
        <div className="width-full flex flex-col gap-3">
          <CardTitle className="truncate">{request.user.name}</CardTitle>

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

      {request.status === MembershipRequestStatus.Pending && (
        <CardContent className="flex justify-end">
          <MembershipRequestActions
            id={request.id}
            organizationId={request.organization.id}
          />
        </CardContent>
      )}

      {request.status === MembershipRequestStatus.Rejected &&
        request.rejectionReason && (
          <CardContent>
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">
                Rejection reason:
              </span>{' '}
              {request.rejectionReason}
            </p>
          </CardContent>
        )}
    </Card>
  );
}
