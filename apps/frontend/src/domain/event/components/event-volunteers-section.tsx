'use client';

import { EventInviteStatus } from '@repo/data';
import type { EventInviteItem } from '@repo/data/react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { LogIn, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserCard } from '@/components/user-card';
import { Link } from '@/i18n/navigation';

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
              const isParticipating =
                invite.status === EventInviteStatus.Accepted ||
                invite.status === EventInviteStatus.SelfJoined;

              return (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <UserCard user={invite.user} size="sm" />
                    {!isParticipating && (
                      <Badge variant="secondary">{t('invitedBadge')}</Badge>
                    )}
                  </div>
                  {isParticipating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/${orgUId}/check-in/${invite.user.checkInId}/check-in`}
                        aria-label={t('checkInAria')}
                      >
                        <Button
                          size="icon-xs"
                          variant="outline"
                          aria-label={t('checkInAria')}
                        >
                          <LogIn />
                        </Button>
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
