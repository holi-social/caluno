'use client';

import {
  type GetMembershipRequestsQuery,
  MembershipRequestStatus,
} from '@repo/data';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import {
  MembershipRequestRequiredForms,
  useRequiredFormsSatisfied,
} from '@/domain/membership-requests/components/membership-request-required-forms';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { useFormatting } from '@/lib/formatting/use-formatting';

interface Props {
  request: GetMembershipRequestsQuery['membershipRequests']['items'][number];
}

export default function MembershipRequestCard({ request }: Props) {
  const { open } = useSheetTrigger('volunteer-profile');
  const t = useTranslations('MembershipRequest');
  const tCommon = useTranslations('Common');
  const { formatDate } = useFormatting();
  const requiredFormsSatisfied = useRequiredFormsSatisfied(
    request.user.id,
    request.organizationUnit.id,
  );

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
      <CardHeader className="gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <AvatarImage
              src={request.user.image ?? undefined}
              alt={tCommon('avatarAlt', { name: request.user.name })}
            />
            <AvatarFallback>
              <UserRound className="size-3" />
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="truncate">{request.user.name}</CardTitle>
            <CardDescription className="truncate">
              {request.user.email}
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <p className="text-muted-foreground text-xs">
            {formatDate(new Date(request.createdAt))}
          </p>
        </CardAction>
      </CardHeader>

      {request.status === MembershipRequestStatus.Pending && (
        <CardContent className="space-y-4">
          <MembershipRequestRequiredForms
            userId={request.user.id}
            organizationUnitId={request.organizationUnit.id}
          />
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={handleViewVolunteer}>
              {t('card.viewButton')}
            </Button>
            <MembershipRequestActions
              id={request.id}
              organizationUnitId={request.organizationUnit.id}
              canApprove={requiredFormsSatisfied}
            />
          </div>
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
