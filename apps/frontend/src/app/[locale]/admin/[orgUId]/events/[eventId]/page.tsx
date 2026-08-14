import { PermissionKey } from '@repo/data';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui';
import { addDays, format, startOfWeek } from 'date-fns';
import { ArrowLeft, CalendarRange, Plus, UserPlus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  DetailCoverImage,
  DetailCoverImagePlaceholder,
  DetailLogoImage,
} from '@/components/detail-entity-image';
import { EventDetailTabSwitcher } from '@/domain/event/components/event-detail-tab-switcher';
import { EventInformationCard } from '@/domain/event/components/event-information-card';
import { EventMetaCard } from '@/domain/event/components/event-meta-card';
import { EventRequiredFormsPopover } from '@/domain/event/components/event-required-forms-popover';
import { EventVolunteersSection } from '@/domain/event/components/event-volunteers-section';
import {
  eventDetailPath,
  eventShiftNewPath,
  eventsListPath,
} from '@/domain/event/routes';
import { CreateShiftButton } from '@/domain/shift/components/create-shift-button';
import { ShiftCreatedDialog } from '@/domain/shift/components/shift-created-dialog';
import { WeeklyCalendar } from '@/domain/shift/components/weekly-calendar';
import { WeeklyCalendarNav } from '@/domain/shift/components/weekly-calendar-nav';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { checkPermission } from '@/lib/permissions-server';

type EventDetailTab = 'shifts' | 'volunteers';

interface EventDetailPageProps {
  params: Promise<{ orgUId: string; eventId: string }>;
  searchParams: Promise<{ tab?: string; week?: string }>;
}

function parseWeekStart(
  param: string | null | undefined,
  fallback: Date,
): Date {
  const base = param ? new Date(param) : fallback;
  const d = Number.isNaN(base.getTime()) ? fallback : base;
  return startOfWeek(d, { weekStartsOn: 1 });
}

function parseTab(param: string | null | undefined): EventDetailTab {
  return param === 'volunteers' ? 'volunteers' : 'shifts';
}

export default async function EventDetailPage({
  params,
  searchParams,
}: EventDetailPageProps) {
  const { orgUId, eventId } = await params;
  const { tab: tabParam, week } = await searchParams;
  const t = await getTranslations('Event.detail');
  const [canEdit = false] = await checkPermission(
    orgUId,
    PermissionKey.ShiftEdit,
  );
  const data = await getDataClient({ orgUId });

  const event = await data.event.findById(eventId);

  if (!event) {
    notFound();
  }

  const activeTab = parseTab(tabParam);
  const weekStart = parseWeekStart(week, new Date(event.startsAt));
  const weekIso = format(weekStart, 'yyyy-MM-dd');
  const createShiftHref = eventShiftNewPath(orgUId, eventId);
  const editHref = `/admin/${orgUId}/events/${eventId}/edit`;

  const invites =
    activeTab === 'volunteers' ? await data.event.findInvites(eventId) : null;

  const instances =
    activeTab === 'shifts'
      ? await data.shift.findForWeek(weekStart, addDays(weekStart, 7), eventId)
      : null;

  return (
    <div className="space-y-6">
      <ShiftCreatedDialog />

      <Link
        href={eventsListPath(orgUId)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-4" />
        {t('backLink')}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {event.logoUrl ? (
            <DetailLogoImage src={event.logoUrl} alt={event.title} />
          ) : null}
          <h1 className="page-title line-clamp-2">{event.title}</h1>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <EventRequiredFormsPopover orgUId={orgUId} eventId={eventId} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/${orgUId}/events/${eventId}/invite`}>
                <UserPlus />
                {t('inviteButton')}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {event.coverUrl ? (
        <DetailCoverImage
          src={event.coverUrl}
          alt={t('coverImageAlt', { title: event.title })}
        />
      ) : canEdit ? (
        <Link
          href={editHref}
          className="block rounded-xl outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <DetailCoverImagePlaceholder
            label={t('imagePlaceholder')}
            className="transition-colors hover:bg-muted/70 hover:text-foreground"
          />
        </Link>
      ) : (
        <DetailCoverImagePlaceholder label={t('imagePlaceholder')} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 h-full">
          <EventInformationCard
            orgUId={orgUId}
            eventId={eventId}
            startsAt={event.startsAt}
            endsAt={event.endsAt}
            location={event.location}
            shiftsCount={event.shiftsCount}
            canEdit={canEdit}
          />
        </div>
        <aside className="h-full">
          <EventMetaCard
            endsAt={event.endsAt}
            createdAt={event.createdAt}
            organizer={event.organizer ?? null}
          />
        </aside>
      </div>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:items-center">
        <div className="justify-self-start">
          <EventDetailTabSwitcher
            orgUId={orgUId}
            eventId={eventId}
            activeTab={activeTab}
            week={weekIso}
          />
        </div>

        <div className="justify-self-center">
          {activeTab === 'shifts' ? (
            <WeeklyCalendarNav
              weekStart={weekStart}
              pathname={eventDetailPath(orgUId, eventId)}
              query={{ tab: 'shifts' }}
            />
          ) : null}
        </div>

        <div className="justify-self-end">
          {activeTab === 'shifts' && canEdit ? (
            <CreateShiftButton
              orgUId={orgUId}
              href={createShiftHref}
              label={t('shiftsCard.addButton')}
            />
          ) : null}
        </div>
      </div>

      {activeTab === 'shifts' ? (
        instances && instances.length > 0 ? (
          <WeeklyCalendar
            instances={instances}
            canManage={canEdit}
            weekStart={weekStart}
            orgUId={orgUId}
          />
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarRange />
              </EmptyMedia>
              <EmptyTitle>{t('shiftsCard.emptyTitle')}</EmptyTitle>
              <EmptyDescription>
                {t('shiftsCard.emptyDescription')}
              </EmptyDescription>
            </EmptyHeader>
            {canEdit ? (
              <EmptyContent>
                <Link href={createShiftHref}>
                  <Button>
                    <Plus />
                    {t('shiftsCard.addButton')}
                  </Button>
                </Link>
              </EmptyContent>
            ) : null}
          </Empty>
        )
      ) : (
        <EventVolunteersSection
          orgUId={orgUId}
          eventId={eventId}
          invites={invites ?? []}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
