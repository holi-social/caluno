'use client';

import { EventInviteStatus, ShiftInviteStatus } from '@repo/data';
import type {
  AvailableShiftInstance,
  DiscoverEvent,
  MyEvent,
  MyShiftInstance,
} from '@repo/data/react';
import {
  useAvailableEvents,
  useAvailableShiftInstances,
  useMyEvents,
  useMyShiftInstances,
} from '@repo/data/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Empty,
  EmptyMedia,
  EmptyTitle,
  SegmentedControl,
  Skeleton,
} from '@repo/ui';
import {
  CalendarSearchIcon,
  CalendarXIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  addDays,
  getDayStripDays,
  getDiscoverWindow,
  groupByDay,
  intervalsOverlap,
  isSameDay,
  startOfDay,
} from '../lib/date-helpers';
import type { DiscoverTab } from '../lib/discover-tabs';
import { mergeInvitations } from '../lib/merge-invitations';
import {
  countEventsThisWeek,
  getEventCardLayout,
  PARTICIPATING_EVENT_STATUSES,
} from '../lib/my-events';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { DayStrip } from './day-strip';
import { DayStripSkeleton } from './day-strip-skeleton';
import { EventCardDiscovery } from './event-card-discovery';
import { EventCardMy } from './event-card-my';
import { InviteCardMyInvited } from './invite-card-my-invited';
import { PendingMembershipBanner } from './pending-membership-banner';
import { ShiftCardDiscovery } from './shift-card-discovery';
import { ShiftCardMy } from './shift-card-my';
import { ShiftCardMyShift } from './shift-card-my-shift';

interface PendingRequest {
  id: string;
  organizationName: string;
  contactName?: string | null;
}

interface VolunteerHomeContentProps {
  initialMyShiftInstances: MyShiftInstance[];
  initialAvailableShiftInstances: AvailableShiftInstance[];
  initialAvailableEvents: DiscoverEvent[];
  initialShiftInvitations: MyShiftInstance[];
  initialEventInvitations: MyEvent[];
  initialMyEvents: MyEvent[];
  hasMemberships: boolean;
  pendingRequest?: PendingRequest | null;
}

export function VolunteerHomeContent({
  initialMyShiftInstances,
  initialAvailableShiftInstances,
  initialAvailableEvents,
  initialShiftInvitations,
  initialEventInvitations,
  initialMyEvents,
  hasMemberships,
  pendingRequest,
}: VolunteerHomeContentProps) {
  const t = useTranslations('VolunteerHome');
  const { formatDate } = useFormatting();
  const [activeDiscoverDay, setActiveDiscoverDay] = useState<Date>(
    startOfDay(new Date()),
  );
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>('assignments');

  const { data: myShiftInstancesPage, isLoading: isLoadingMy } =
    useMyShiftInstances(
      { limit: 10, includeIntended: true },
      {
        initialData: {
          items: initialMyShiftInstances,
          pagination: {
            total: initialMyShiftInstances.length,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
        },
      },
    );

  const discoverOptions = useMemo(() => getDiscoverWindow(), []);

  const { data: availableShiftInstancesPage, isLoading: isLoadingAvailable } =
    useAvailableShiftInstances(discoverOptions, {
      initialData: {
        items: initialAvailableShiftInstances,
        pagination: {
          total: initialAvailableShiftInstances.length,
          limit: 15,
          offset: 0,
          hasMore: false,
        },
      },
    });

  const { data: availableEventsPage, isLoading: isLoadingAvailableEvents } =
    useAvailableEvents(
      { limit: 10 },
      {
        initialData: {
          items: initialAvailableEvents,
          pagination: {
            total: initialAvailableEvents.length,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
        },
      },
    );

  const { data: shiftInvitationsPage } = useMyShiftInstances(
    { limit: 10, statuses: [ShiftInviteStatus.AdminInvited] },
    {
      initialData: {
        items: initialShiftInvitations,
        pagination: {
          total: initialShiftInvitations.length,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      },
    },
  );

  const { data: eventInvitationsPage } = useMyEvents(
    { limit: 10, statuses: [EventInviteStatus.AdminInvited] },
    {
      initialData: {
        items: initialEventInvitations,
        pagination: {
          total: initialEventInvitations.length,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      },
    },
  );

  const invitationList = useMemo(
    () =>
      mergeInvitations(
        shiftInvitationsPage?.items ?? [],
        eventInvitationsPage?.items ?? [],
      ),
    [shiftInvitationsPage?.items, eventInvitationsPage?.items],
  );

  const { data: myEventsPage } = useMyEvents(
    { limit: 10, statuses: [...PARTICIPATING_EVENT_STATUSES] },
    {
      initialData: {
        items: initialMyEvents,
        pagination: {
          total: initialMyEvents.length,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      },
    },
  );
  const joinedEvents = myEventsPage?.items ?? [];

  const showLoadingMy = useDelayedLoading(isLoadingMy);
  const showLoadingAvailable = useDelayedLoading(isLoadingAvailable);
  const showLoadingAvailableEvents = useDelayedLoading(
    isLoadingAvailableEvents,
  );

  const myShiftList = myShiftInstancesPage?.items ?? [];
  const availableShiftList = availableShiftInstancesPage?.items ?? [];
  const availableEventList = availableEventsPage?.items ?? [];

  const myShiftIds = useMemo(
    () => new Set(myShiftList.map((shift) => shift.id)),
    [myShiftList],
  );

  const filteredAvailableShiftList = useMemo(
    () => availableShiftList.filter((shift) => !myShiftIds.has(shift.id)),
    [availableShiftList, myShiftIds],
  );

  const discoverDayStrip = useMemo(
    () => getDayStripDays(filteredAvailableShiftList, { minDays: 7 }),
    [filteredAvailableShiftList],
  );

  const availableGrouped = useMemo(
    () => groupByDay(filteredAvailableShiftList),
    [filteredAvailableShiftList],
  );

  const { myThisWeekCount, discoverThisWeekCount } = useMemo(() => {
    const start = startOfDay(new Date());
    const end = addDays(start, 7);
    const countThisWeek = (list: { actualStartsAt: string }[]) =>
      list.filter((item) => {
        const date = new Date(item.actualStartsAt);
        return date >= start && date < end;
      }).length;
    return {
      myThisWeekCount: countThisWeek(myShiftList),
      discoverThisWeekCount: countThisWeek(filteredAvailableShiftList),
    };
  }, [myShiftList, filteredAvailableShiftList]);

  const conflictingShiftIds = useMemo(() => {
    const booked = myShiftList
      .filter((shift) => !shift.isIntendingToJoin)
      .map((shift) => ({
        id: shift.id,
        start: new Date(shift.actualStartsAt),
        end: new Date(shift.actualEndsAt),
      }));
    const conflicts = new Set<string>();
    for (const shift of filteredAvailableShiftList) {
      const start = new Date(shift.actualStartsAt);
      const end = new Date(shift.actualEndsAt);
      if (
        booked.some(
          (b) =>
            b.id !== shift.id && intervalsOverlap(start, end, b.start, b.end),
        )
      ) {
        conflicts.add(shift.id);
      }
    }
    return conflicts;
  }, [myShiftList, filteredAvailableShiftList]);

  // Discover shows one day's shifts at a time, laid out in two columns on
  // desktop. The day strip highlights that day; its arrows step between the
  // days that actually have shifts.
  const activeGroupIndex = availableGrouped.findIndex((group) =>
    isSameDay(group.date, activeDiscoverDay),
  );
  const resolvedIndex = activeGroupIndex >= 0 ? activeGroupIndex : 0;
  const selectedGroup = availableGrouped[resolvedIndex];
  const hasPrevDay = resolvedIndex > 0;
  const hasNextDay = resolvedIndex < availableGrouped.length - 1;
  const goToDay = (delta: number) => {
    const group = availableGrouped[resolvedIndex + delta];
    if (group) setActiveDiscoverDay(group.date);
  };

  // The soonest shift that hasn't ended yet — a shift that started today but
  // already finished must not be shown as the actionable "next" card.
  const now = Date.now();
  const firstUpcomingIndex = myShiftList.findIndex(
    (shift) => new Date(shift.actualEndsAt).getTime() >= now,
  );
  const nextShift =
    firstUpcomingIndex >= 0 ? myShiftList[firstUpcomingIndex] : undefined;
  const futureShifts =
    firstUpcomingIndex >= 0 ? myShiftList.slice(firstUpcomingIndex + 1) : [];

  const seeAllLink = (href: string) => (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
    >
      {t('yourShiftsSeeAll')}
      <ChevronRightIcon className="size-4" />
    </Link>
  );

  const yourShiftsSection = (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('yourShiftsHeading')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('yourShiftsThisWeek', { n: myThisWeekCount })}
          </p>
        </div>
        {seeAllLink('/my-shifts')}
      </div>

      {showLoadingMy ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="h-24 flex-1 rounded-xl" />
            <Skeleton className="h-24 flex-1 rounded-xl" />
          </div>
        </div>
      ) : myShiftList.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <CalendarXIcon />
          </EmptyMedia>
          <EmptyTitle>{t('yourShiftsEmpty')}</EmptyTitle>
          <Button asChild variant="default" size="lg">
            <Link href="/discover">{t('discoverCta')}</Link>
          </Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {nextShift && (
            <ShiftCardMy
              shiftInstance={nextShift}
              isPending={!nextShift.myInviteStatus}
            />
          )}
          {futureShifts.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {futureShifts.map((shift) => (
                <div key={shift.id} className="w-[168px] shrink-0">
                  <ShiftCardMyShift
                    shiftInstance={shift}
                    showDate
                    isPending={!shift.myInviteStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );

  const invitationsSection = (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('invitationsHeading')}
          </h2>
          <Badge variant="default">{invitationList.length}</Badge>
        </div>
        {seeAllLink('/invitations')}
      </div>
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
        {invitationList.map((invite) => (
          <InviteCardMyInvited
            key={`${invite.kind}-${invite.id}`}
            invite={invite}
          />
        ))}
      </div>
    </section>
  );

  const eventsThisWeekCount = useMemo(
    () => countEventsThisWeek(joinedEvents, new Date()),
    [joinedEvents],
  );
  const eventCardLayout = getEventCardLayout(joinedEvents.length);

  const yourEventsSection = (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('yourEventsHeading')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('yourEventsThisWeek', { n: eventsThisWeekCount })}
          </p>
        </div>
        {seeAllLink('/my-events')}
      </div>
      <div
        className={cn(
          'flex items-stretch gap-2 lg:grid lg:grid-cols-2 lg:overflow-visible',
          eventCardLayout === 'scroller' && 'overflow-x-auto pb-2',
        )}
      >
        {joinedEvents.map((event) => (
          <div
            key={event.id}
            className={cn(
              eventCardLayout === 'fill' ? 'flex-1' : 'w-[150px] shrink-0',
              'lg:w-auto',
            )}
          >
            <EventCardMy event={event} />
          </div>
        ))}
      </div>
    </section>
  );

  const showPendingBanner = !hasMemberships && pendingRequest != null;

  const discoverSection = (
    <section>
      {showPendingBanner &&
      !showLoadingAvailable &&
      !showLoadingAvailableEvents &&
      filteredAvailableShiftList.length === 0 &&
      availableEventList.length === 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-foreground">
              {t('discoverHeading')}
            </h2>
            <p className="text-base text-muted-foreground">
              {t('discoverPendingSubtitle', {
                orgName: pendingRequest.organizationName,
              })}
            </p>
          </div>
          <Card className="gap-0 py-7">
            <CardContent className="flex flex-col items-center gap-4 px-5 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <CalendarSearchIcon className="size-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground">
                  {t('discoverPendingEmptyTitle')}
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {t('discoverPendingEmptyBody', {
                    orgName: pendingRequest.organizationName,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-foreground">
                {t('discoverHeading')}
              </h2>
              <p className="text-base text-muted-foreground">
                {t('discoverThisWeek', { n: discoverThisWeekCount })}
              </p>
            </div>
            {seeAllLink(
              discoverTab === 'events' ? '/discover?tab=events' : '/discover',
            )}
          </div>

          <SegmentedControl
            className="mb-3"
            size="lg"
            value={discoverTab}
            onChange={(value) => setDiscoverTab(value as DiscoverTab)}
            options={[
              { value: 'assignments', label: t('discoverTabAssignments') },
              { value: 'events', label: t('discoverTabEvents') },
            ]}
          />

          {discoverTab === 'assignments' ? (
            <>
              {showLoadingAvailable ? (
                <DayStripSkeleton />
              ) : (
                <DayStrip
                  days={discoverDayStrip}
                  activeDate={activeDiscoverDay}
                  activeDates={selectedGroup ? [selectedGroup.date] : []}
                  onSelect={setActiveDiscoverDay}
                  todayLabel={t('todayButton')}
                  paged
                  hasPrev={hasPrevDay}
                  hasNext={hasNextDay}
                  onPrev={() => goToDay(-1)}
                  onNext={() => goToDay(1)}
                  shiftCountLabel={(n) => t('yourShiftsCount', { n })}
                  className="mb-3"
                />
              )}

              {showLoadingAvailable ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : filteredAvailableShiftList.length === 0 ? (
                <Empty>
                  <EmptyMedia variant="icon">
                    <CalendarXIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t('discoverEmptyHome')}</EmptyTitle>
                  <Button asChild variant="default" size="lg">
                    <Link href="/discover">{t('discoverCta')}</Link>
                  </Button>
                </Empty>
              ) : (
                selectedGroup && (
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {formatDate(selectedGroup.date, {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </h3>
                      <span className="shrink-0 text-base text-muted-foreground">
                        {t('yourShiftsCount', {
                          n: selectedGroup.items.length,
                        })}
                      </span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
                      {selectedGroup.items.map((shift) => (
                        <ShiftCardDiscovery
                          key={shift.id}
                          shiftInstance={shift}
                          conflictsWithBooked={conflictingShiftIds.has(
                            shift.id,
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </>
          ) : showLoadingAvailableEvents ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : availableEventList.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <CalendarXIcon />
              </EmptyMedia>
              <EmptyTitle>{t('discoverEventsEmptyHome')}</EmptyTitle>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
              {availableEventList.map((event) => (
                <EventCardDiscovery key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-8">
      {showPendingBanner && (
        <PendingMembershipBanner
          orgName={pendingRequest.organizationName}
          contactName={pendingRequest.contactName}
          requestsHref="/profile"
        />
      )}
      {(showLoadingMy || myShiftList.length > 0) && yourShiftsSection}
      {invitationList.length > 0 && invitationsSection}
      {joinedEvents.length > 0 && yourEventsSection}
      {discoverSection}
    </div>
  );
}
