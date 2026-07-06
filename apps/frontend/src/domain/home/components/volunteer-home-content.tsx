'use client';

import type {
  AvailableShiftInstance,
  GetMyAccessibleOrganizationUnitsQuery,
  MyShiftInstance,
} from '@repo/data/react';
import {
  useAvailableShiftInstances,
  useCheckIn,
  useCheckOut,
  useMyAccessibleOrganizationUnits,
  useMyShiftInstances,
} from '@repo/data/react';
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@repo/ui';
import { CalendarXIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  addDays,
  getDayStripDays,
  getNextWeekRange,
  getThisWeekendRange,
  groupByDay,
  startOfDay,
} from '../lib/date-helpers';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { DayStrip } from './day-strip';
import { DayStripSkeleton } from './day-strip-skeleton';
import { FilterChip } from './filter-chip';
import { ShiftCardDiscoveryEvent } from './shift-card-discovery-event';
import { ShiftCardDiscoverySolo } from './shift-card-discovery-solo';
import { ShiftCardMy } from './shift-card-my';
import { ShiftCardMyFuture } from './shift-card-my-future';

type DateFilter = 'next-week' | 'this-weekend' | null;

type OrganizationUnit =
  GetMyAccessibleOrganizationUnitsQuery['myAccessibleOrganizationUnits'][number];

interface VolunteerHomeContentProps {
  initialMyShiftInstances: MyShiftInstance[];
  initialAvailableShiftInstances: AvailableShiftInstance[];
  initialOrganizationUnits?: OrganizationUnit[];
}

export function VolunteerHomeContent({
  initialMyShiftInstances,
  initialAvailableShiftInstances,
  initialOrganizationUnits,
}: VolunteerHomeContentProps) {
  const t = useTranslations('VolunteerHome');
  const { formatDate } = useFormatting();
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<string[]>([]);
  const [activeDiscoverDay, setActiveDiscoverDay] = useState<Date>(
    startOfDay(new Date()),
  );

  const { data: myShiftInstances, isLoading: isLoadingMy } =
    useMyShiftInstances(false, { initialData: initialMyShiftInstances });
  const { mutate: checkIn } = useCheckIn();
  const { mutate: checkOut } = useCheckOut();

  const { data: organizationUnits } = useMyAccessibleOrganizationUnits({
    initialData: initialOrganizationUnits,
  });

  const discoverOptions = useMemo(() => {
    if (dateFilter === 'next-week') return getNextWeekRange();
    if (dateFilter === 'this-weekend') return getThisWeekendRange();
    return {
      from: startOfDay(new Date()),
      to: addDays(startOfDay(new Date()), 90),
      organizationUnitIds:
        selectedOrgUnitIds.length > 0 ? selectedOrgUnitIds : undefined,
    };
  }, [dateFilter, selectedOrgUnitIds]);

  const { data: availableShiftInstances, isLoading: isLoadingAvailable } =
    useAvailableShiftInstances(discoverOptions, {
      initialData: initialAvailableShiftInstances,
    });

  const showLoadingMy = useDelayedLoading(isLoadingMy);
  const showLoadingAvailable = useDelayedLoading(isLoadingAvailable);

  const myShiftList = myShiftInstances ?? [];
  const availableShiftList = availableShiftInstances ?? [];

  const discoverDayStrip = useMemo(
    () => getDayStripDays(availableShiftList),
    [availableShiftList],
  );

  const availableGrouped = useMemo(
    () => groupByDay(availableShiftList),
    [availableShiftList],
  );

  const activeDiscoverGroup = availableGrouped.find(
    (group) => group.date.getTime() === activeDiscoverDay.getTime(),
  );

  const nextShift = myShiftList[0];
  const futureShifts = myShiftList.slice(1);

  const hasActiveDiscoverFilters =
    dateFilter !== null || selectedOrgUnitIds.length > 0;

  const toggleOrgUnit = (id: string) => {
    setSelectedOrgUnitIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const yourShiftsSection = (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{t('yourShiftsHeading')}</h2>
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline text-sm text-muted-foreground">
            {t('yourShiftsCount', { n: myShiftList.length })}
          </span>
          <Link
            href="/my-shifts"
            className="text-sm text-primary hover:underline"
          >
            {t('yourShiftsSeeAll')}
          </Link>
        </div>
      </div>

      {showLoadingMy ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Skeleton className="h-32 w-48 shrink-0 rounded-xl" />
          <Skeleton className="h-32 w-48 shrink-0 rounded-xl" />
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
        <div className="flex gap-3 overflow-x-auto pb-2">
          {nextShift && (
            <div className="w-full min-w-[280px]">
              <ShiftCardMy
                shiftInstance={nextShift}
                timerStartsInLabel={t('timerStartsIn')}
                timerStartedAgoLabel={t('timerStartedAgo')}
                timerVolunteeringLabel={t('timerVolunteering')}
                checkInLabel={t('checkIn')}
                checkOutLabel={t('checkOut')}
                onCheckIn={() => checkIn(nextShift.id)}
                onCheckOut={() => checkOut(nextShift.id)}
              />
            </div>
          )}
          {futureShifts.map((shift) => (
            <ShiftCardMyFuture key={shift.id} shiftInstance={shift} />
          ))}
        </div>
      )}
    </section>
  );

  const discoverSection = (
    <section>
      <h2 className="text-lg font-semibold mb-3">{t('discoverHeading')}</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        <FilterChip
          label={t('filterNextWeek')}
          active={dateFilter === 'next-week'}
          onClick={() =>
            setDateFilter((prev) => (prev === 'next-week' ? null : 'next-week'))
          }
        />
        <FilterChip
          label={t('filterThisWeekend')}
          active={dateFilter === 'this-weekend'}
          onClick={() =>
            setDateFilter((prev) =>
              prev === 'this-weekend' ? null : 'this-weekend',
            )
          }
        />
        {(organizationUnits ?? []).map((unit) => (
          <FilterChip
            key={unit.id}
            label={unit.name}
            active={selectedOrgUnitIds.includes(unit.id)}
            onClick={() => toggleOrgUnit(unit.id)}
          />
        ))}
      </div>

      {showLoadingAvailable ? (
        <DayStripSkeleton />
      ) : (
        <DayStrip
          days={discoverDayStrip}
          activeDate={activeDiscoverDay}
          onSelect={setActiveDiscoverDay}
          todayLabel={t('todayButton')}
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
            {hasActiveDiscoverFilters ? <SearchXIcon /> : <CalendarXIcon />}
          </EmptyMedia>
          <EmptyTitle>{t('discoverEmpty')}</EmptyTitle>
          {hasActiveDiscoverFilters && (
            <EmptyDescription>{t('discoverEmptyBody')}</EmptyDescription>
          )}
          {!hasActiveDiscoverFilters && (
            <Button asChild variant="default" size="lg">
              <Link href="/discover">{t('discoverCta')}</Link>
            </Button>
          )}
        </Empty>
      ) : activeDiscoverGroup ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {formatDate(activeDiscoverGroup.date, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            <span className="ml-2">{activeDiscoverGroup.items.length}</span>
          </h3>
          <div className="space-y-3">
            {activeDiscoverGroup.items.map((shift) =>
              shift.master.event ? (
                <ShiftCardDiscoveryEvent key={shift.id} shiftInstance={shift} />
              ) : (
                <ShiftCardDiscoverySolo key={shift.id} shiftInstance={shift} />
              ),
            )}
          </div>
        </div>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <CalendarXIcon />
          </EmptyMedia>
          <EmptyTitle>{t('discoverEmpty')}</EmptyTitle>
        </Empty>
      )}
    </section>
  );

  return (
    <div className="flex flex-col lg:flex-row-reverse lg:gap-12 gap-8">
      {yourShiftsSection}
      {discoverSection}
    </div>
  );
}
