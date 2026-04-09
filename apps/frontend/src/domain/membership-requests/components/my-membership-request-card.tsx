import {
  type GetMyMembershipRequestsQuery,
  MembershipRequestStatus,
} from '@repo/data';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { formatDate } from '@/lib/formatting';
import { CancelMembershipRequestButton } from './cancel-membership-request-button';

const BG_COLOR_MAP: Record<string, string> = {
  [MembershipRequestStatus.Accepted]: 'bg-green-950',
  [MembershipRequestStatus.Rejected]: 'bg-red-950',
};

type MyMembershipRequestItem =
  GetMyMembershipRequestsQuery['myMembershipRequests']['items'][number];

interface Props {
  request: MyMembershipRequestItem;
}

export default function MyMembershipRequestCard({ request }: Props) {
  const date =
    request.status === MembershipRequestStatus.Pending
      ? request.createdAt
      : request.reviewedAt;

  const bgColor = BG_COLOR_MAP[request.status] ?? '';

  return (
    <Card className={`w-full ${bgColor}`}>
      <CardHeader className="flex flex-row gap-3">
        <div className="w-full flex flex-col gap-1">
          <CardTitle>{request.organizationUnit.name}</CardTitle>
        </div>

        {date && (
          <div className="w-full flex justify-end items-center">
            <CardAction>
              <p className="text-muted-foreground text-xs">
                {formatDate(new Date(date))}
              </p>
            </CardAction>
          </div>
        )}
      </CardHeader>

      {request.status === MembershipRequestStatus.Pending && (
        <CardContent className="flex justify-end">
          <CancelMembershipRequestButton
            id={request.id}
            organizationUnitId={request.organizationUnit.id}
          />
        </CardContent>
      )}
    </Card>
  );
}
