'use client';

import { MembershipRequestStatus } from '@repo/data';
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
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link } from '@/i18n/navigation';

interface EventVolunteersCardProps {
  orgUId: string;
  eventId: string;
  attendees: EventAttendee[];
  canEdit: boolean;
}

export function EventVolunteersSection({
  orgUId,
  eventId,
  attendees,
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
          <Badge variant="outline">{attendees.length}</Badge>
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
                    aria-label={tVolunteer('viewProfileAria')}
                    onClick={() =>
                      openVolunteerSheet({
                        userId: attendee.id,
                        volunteerName: attendee.name,
                        volunteerStatus: MembershipRequestStatus.Accepted,
                        volunteerEmail: attendee.email ?? '',
                        volunteerCheckInId: attendee.checkInId,
                      })
                    }
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
