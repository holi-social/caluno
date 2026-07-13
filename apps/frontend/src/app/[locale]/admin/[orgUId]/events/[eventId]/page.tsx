import { PermissionKey } from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowLeft, MapPin, SquarePen, UserPlus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EventShiftsCard } from '@/domain/event/components/event-shifts-card';
import { EventVolunteersCard } from '@/domain/event/components/event-volunteers-card';
import { eventsListPath } from '@/domain/event/routes';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { checkPermission } from '@/lib/permissions-server';

interface EventDetailPageProps {
  params: Promise<{ orgUId: string; eventId: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { orgUId, eventId } = await params;
  const t = await getTranslations('Event.detail');
  const [canEdit = false] = await checkPermission(
    orgUId,
    PermissionKey.ShiftEdit,
  );
  const data = await getDataClient({ orgUId });
  const { formatRange } = await getFormatting();

  const event = await data.event.findById(eventId);

  if (!event) {
    notFound();
  }

  const attendees = await data.event.findAttendees(eventId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={eventsListPath(orgUId)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-4" />
        {t('backLink')}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title line-clamp-2">{event.title}</h1>
          <p className="text-muted-foreground mt-1">
            {formatRange(event.startsAt, event.endsAt)}
          </p>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="size-4 shrink-0" />
            {event.location ?? '—'}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2 shrink-0">
            <Link href={`/admin/${orgUId}/events/${eventId}/edit`}>
              <Button variant="outline">
                <SquarePen />
                {t('editButton')}
              </Button>
            </Link>
            <Link href={`/admin/${orgUId}/events/${eventId}/invite`}>
              <Button variant="outline">
                <UserPlus />
                {t('inviteButton')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <EventVolunteersCard
          orgUId={orgUId}
          eventId={eventId}
          attendees={attendees}
          canEdit={canEdit}
        />
        <EventShiftsCard
          orgUId={orgUId}
          eventId={eventId}
          shifts={event.shifts}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
