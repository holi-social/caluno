'use client';

import {
  type GetMembershipRequestsQuery,
  MembershipRequestStatus,
} from '@repo/data';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MembershipRequestActions } from '@/domain/membership-requests/components/membership-request-actions';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { useFormatting } from '@/lib/formatting/use-formatting';

interface Props {
  request: GetMembershipRequestsQuery['membershipRequests']['items'][number];
}

export default function MembershipRequestCard({ request }: Props) {
  const { open } = useSheetTrigger('volunteer-profile');
  const t = useTranslations('MembershipRequest');
  const { formatDate } = useFormatting();

  const handleViewVolunteer = () => {
    open({
      userId: request.user.id,
      volunteerName: request.user.name,
      volunteerStatus: request.status,
      volunteerEmail: request.user.email,
      volunteerCheckInId: request.user.checkInId,
    });
  };

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
        <CardContent className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleViewVolunteer}>
            {t('card.viewButton')}
          </Button>
          <MembershipRequestActions
            id={request.id}
            organizationUnitId={request.organizationUnit.id}
          />
        </CardContent>
      )}

      {request.status === MembershipRequestStatus.Rejected && (
        <CardContent className="flex items-center justify-between">
          {request.rejectionReason ? (
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">
                {t('card.rejectionReasonLabel')}
              </span>{' '}
              {request.rejectionReason}
            </p>
          ) : (
            <span />
          )}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={handleViewVolunteer}
            aria-label={t('card.viewAria')}
          >
            <UserRound />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
