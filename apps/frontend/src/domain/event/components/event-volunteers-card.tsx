'use client';

import type { EventAttendee } from '@repo/data/react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { LogIn, UserPlus, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserCard } from '@/components/user-card';
import { Link } from '@/i18n/navigation';

interface EventVolunteersCardProps {
  orgUId: string;
  eventId: string;
  attendees: EventAttendee[];
  canEdit: boolean;
}

export function EventVolunteersCard({
  orgUId,
  eventId,
  attendees,
  canEdit,
}: EventVolunteersCardProps) {
  const t = useTranslations('Event.detail.volunteersCard');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('title')}
          <Badge variant="outline">{attendees.length}</Badge>
        </CardTitle>

        {canEdit && (
          <CardAction>
            <Link href={`/admin/${orgUId}/events/${eventId}/invite`}>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label={t('inviteAria')}
              >
                <UserPlus />
              </Button>
            </Link>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {attendees.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {attendees.map((attendee) => (
              <li
                key={attendee.id}
                className="flex items-center justify-between gap-2"
              >
                <UserCard user={attendee} size="sm" />
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon-xs"
                    variant="outline"
                    aria-label={t('viewProfileAria')}
                  >
                    <UserRound />
                  </Button>

                  <Link
                    href={`/admin/${orgUId}/check-in/${attendee.checkInId}/check-in`}
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
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
