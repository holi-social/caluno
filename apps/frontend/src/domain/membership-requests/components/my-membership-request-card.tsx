import {
  type GetMyMembershipRequestsQuery,
  MembershipRequestStatus,
} from '@repo/data';
import {
  Badge,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { CancelMembershipRequestButton } from './cancel-membership-request-button';

type MyMembershipRequestItem =
  GetMyMembershipRequestsQuery['myMembershipRequests']['items'][number];

interface Props {
  request: MyMembershipRequestItem;
}

export default function MyMembershipRequestCard({ request }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row gap-3">
        <div className="w-full flex flex-col gap-1">
          <CardTitle>{request.organizationUnit.name}</CardTitle>
        </div>

        <div className="w-full flex justify-end items-center">
          <CardAction className="flex gap-2 items-center">
            <Badge variant="info">{request.status}</Badge>
          </CardAction>
        </div>
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
