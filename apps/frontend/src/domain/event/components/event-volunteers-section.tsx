'use client';

import { MembershipRequestStatus } from '@repo/data';
import type { EventInviteItem } from '@repo/data/react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  VolunteeringStatusBadge,
} from '@repo/ui';
import { ScanQrCode, UserPlus, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserCard } from '@/components/user-card';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link } from '@/i18n/navigation';
import { toEventInviteDisplayState } from '../invite-status-display';

interface EventVolunteersCardProps {
  orgUId: string;
  eventId: string;
  invites: EventInviteItem[];
  canEdit: boolean;
}

export function EventVolunteersSection({
  orgUId,
  eventId,
  invites,
  canEdit,
}: EventVolunteersCardProps) {
  const t = useTranslations('Event.detail.volunteersCard');
  const tVolunteer = useTranslations('Volunteer.action');
  const { open: openVolunteerSheet } = useSheetTrigger('volunteer-profile');

  return (
    <Card className="py-4">
      <CardHeader className="border-b [.border-b]:pb-4">
        <CardTitle className="flex items-center gap-2">
          {t('title')}
          <Badge variant="outline">{invites.length}</Badge>
        </CardTitle>

        {canEdit && (
          <CardAction>
            <Link href={`/admin/${orgUId}/events/${eventId}/invite`}>
              <Button>
                <UserPlus />
                {t('inviteButton')}
              </Button>
            </Link>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {invites.map((invite) => {
              const displayState = toEventInviteDisplayState(invite.status);

              return (
                <li
                  key={invite.id}
                  className="flex items-center gap-2 sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <UserCard user={invite.user} size="sm" />
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <VolunteeringStatusBadge
                      state={displayState}
                      phase="before"
                      label={
                        displayState === 'signed_up'
                          ? t('status.signedUp')
                          : t('status.invited')
                      }
                    />
                    <Button
                      size="icon-xs"
                      variant="outline"
                      aria-label={tVolunteer('viewProfileAria')}
                      onClick={() =>
                        openVolunteerSheet({
                          userId: invite.user.id,
                          volunteerName: invite.user.name,
                          volunteerStatus: MembershipRequestStatus.Accepted,
                          volunteerEmail: invite.user.email ?? '',
                          volunteerCheckInId: invite.user.checkInId,
                        })
                      }
                    >
                      <UserRound />
                    </Button>
                    <Link
                      href={`/admin/${orgUId}/check-in/${invite.user.checkInId}/check-in`}
                      aria-label={t('checkInAria')}
                    >
                      <Button
                        size="icon-xs"
                        variant="outline"
                        aria-label={t('checkInAria')}
                      >
                        <ScanQrCode />
                      </Button>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
