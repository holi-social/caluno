'use client';

import type { AvailableShiftInstance, MyShiftInstance } from '@repo/data/react';
import {
  useAvailableShiftInstances,
  useCheckIn,
  useCheckOut,
  useMyShiftInstances,
} from '@repo/data/react';
import { Button, Empty, EmptyMedia, EmptyTitle, Skeleton } from '@repo/ui';
import { CalendarXIcon, ChevronRightIcon } from 'lucide-react';
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
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { DayStrip } from './day-strip';
import { DayStripSkeleton } from './day-strip-skeleton';
import { ShiftCardDiscovery } from './shift-card-discovery';
import { ShiftCardMy } from './shift-card-my';
import { ShiftCardMyShift } from './shift-card-my-shift';

interface VolunteerHomeContentProps {
  initialMyShiftInstances: MyShiftInstance[];
  initialAvailableShiftInstances: AvailableShiftInstance[];
}

export function VolunteerHomeContent({
  initialMyShiftInstances,
  initialAvailableShiftInstances,
}: VolunteerHomeContentProps) {
  const t = useTranslations('VolunteerHome');
  const { formatDate } = useFormatting();
  const [activeDiscoverDay, setActiveDiscoverDay] = useState<Date>(
    startOfDay(new Date()),
  );

  const { data: myShiftInstances, isLoading: isLoadingMy } =
    useMyShiftInstances(false, { initialData: initialMyShiftInstances });
  const { mutate: checkIn } = useCheckIn();
  const { mutate: checkOut } = useCheckOut();

  const discoverOptions = useMemo(() => getDiscoverWindow(), []);

  const { data: availableShiftInstances, isLoading: isLoadingAvailable } =
    useAvailableShiftInstances(discoverOptions, {
      initialData: initialAvailableShiftInstances,
    });

  const showLoadingMy = useDelayedLoading(isLoadingMy);
  const showLoadingAvailable = useDelayedLoading(isLoadingAvailable);

  const myShiftList = myShiftInstances ?? [];
  const availableShiftList = availableShiftInstances ?? [];

  const discoverDayStrip = useMemo(
    () => getDayStripDays(availableShiftList, { minDays: 7 }),
    [availableShiftList],
  );

  const availableGrouped = useMemo(
    () => groupByDay(availableShiftList),
    [availableShiftList],
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
      discoverThisWeekCount: countThisWeek(availableShiftList),
    };
  }, [myShiftList, availableShiftList]);

  const conflictingShiftIds = useMemo(() => {
    const booked = myShiftList.map((shift) => ({
      start: new Date(shift.actualStartsAt),
      end: new Date(shift.actualEndsAt),
    }));
    const conflicts = new Set<string>();
    for (const shift of availableShiftList) {
      const start = new Date(shift.actualStartsAt);
      const end = new Date(shift.actualEndsAt);
      if (booked.some((b) => intervalsOverlap(start, end, b.start, b.end))) {
        conflicts.add(shift.id);
      }
    }
    return conflicts;
  }, [myShiftList, availableShiftList]);

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
              onCheckIn={() => checkIn(nextShift.id)}
              onCheckOut={() => checkOut(nextShift.id)}
            />
          )}
          {futureShifts.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {futureShifts.map((shift) => (
                <div key={shift.id} className="w-[168px] shrink-0">
                  <ShiftCardMyShift shiftInstance={shift} showDate />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );

  const discoverSection = (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('discoverHeading')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('discoverThisWeek', { n: discoverThisWeekCount })}
          </p>
        </div>
        {seeAllLink('/discover')}
      </div>

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
      ) : availableShiftList.length === 0 ? (
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
                {t('yourShiftsCount', { n: selectedGroup.items.length })}
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
              {selectedGroup.items.map((shift) => (
                <ShiftCardDiscovery
                  key={shift.id}
                  shiftInstance={shift}
                  conflictsWithBooked={conflictingShiftIds.has(shift.id)}
                />
              ))}
            </div>
          </div>
        )
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-8">
      {(showLoadingMy || myShiftList.length > 0) && yourShiftsSection}
      {discoverSection}
    </div>
  );
}
