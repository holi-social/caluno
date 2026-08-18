import { PermissionKey } from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowLeft, Calendar, MapPin, SquarePen, UserPlus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  DetailCoverImage,
  DetailLogoImage,
} from '@/components/detail-entity-image';
import { AdminEventShiftsSection } from '@/domain/event/components/admin-event-shifts-section';
import { EventRequiredFormsPopover } from '@/domain/event/components/event-required-forms-popover';
import { EventVolunteersSection } from '@/domain/event/components/event-volunteers-section';

import { eventsListPath } from '@/domain/event/routes';
import { ShiftCreatedDialog } from '@/domain/shift/components/shift-created-dialog';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { checkPermission } from '@/lib/permissions-server';

interface EventDetailPageProps {
  params: Promise<{ orgUId: string; eventId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 10;

export default async function EventDetailPage({
  params,
  searchParams,
}: EventDetailPageProps) {
  const { orgUId, eventId } = await params;
  const { page } = await searchParams;
  const t = await getTranslations('Event.detail');
  const [canEdit = false] = await checkPermission(
    orgUId,
    PermissionKey.ShiftEdit,
  );
  const data = await getDataClient({ orgUId });
  const { formatRange } = await getFormatting();

  const currentPage = Number.parseInt(page ?? '1', 10) || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const event = await data.event.findById(eventId);

  if (!event) {
    notFound();
  }

  const [invites, { items: shifts, pagination: shiftsPagination }] =
    await Promise.all([
      await data.event.findInvites(eventId),
      await data.shift.findAllForEvent(eventId, {
        limit: ITEMS_PER_PAGE,
        offset,
      }),
    ]);

  const instanceRefs = shifts.length
    ? await data.shift.findInstancesByMasterIds(shifts.map((shift) => shift.id))
    : [];
  const instanceIdByShiftId = new Map(
    instanceRefs.map((group) => [group.masterId, group.instances[0]?.id]),
  );
  const shiftsWithInstances = shifts.map((shift) => {
    const instanceId = instanceIdByShiftId.get(shift.id);
    return { ...shift, instance: instanceId ? { id: instanceId } : null };
  });

  return (
    <div className="flex flex-col gap-6">
      <ShiftCreatedDialog />

      <Link
        href={eventsListPath(orgUId)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-4" />
        {t('backLink')}
      </Link>

      {event.coverUrl ? (
        <DetailCoverImage
          src={event.coverUrl}
          alt={t('coverImageAlt', { title: event.title })}
        />
      ) : null}

      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        {event.logoUrl ? (
          <DetailLogoImage src={event.logoUrl} alt={event.title} />
        ) : null}
        <div className="flex flex-col min-w-0 gap-3">
          <h1 className="page-title line-clamp-2">{event.title}</h1>

          <p className="text-muted-foreground text-lg flex items-center gap-1 mt-1">
            <Calendar className="shrink-0" />
            {formatRange(event.startsAt, event.endsAt)}
          </p>

          {event.location ? (
            <p className="text-muted-foreground text-lg flex items-center gap-1 mt-1">
              <MapPin className="shrink-0" />
              {event.location}
            </p>
          ) : null}
        </div>

        {canEdit && (
          <div className="flex flex-col md:flex-row gap-2 shrink-0">
            <EventRequiredFormsPopover orgUId={orgUId} eventId={eventId} />
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
        <EventVolunteersSection
          orgUId={orgUId}
          eventId={eventId}
          invites={invites}
          canEdit={canEdit}
        />
        <AdminEventShiftsSection
          orgUId={orgUId}
          eventId={eventId}
          shifts={shiftsWithInstances}
          pagination={shiftsPagination}
          currentPage={currentPage}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
