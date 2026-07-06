'use client';

import type {
  AvailableShiftInstance,
  GetMyAccessibleOrganizationUnitsQuery,
} from '@repo/data/react';
import {
  useAvailableShiftInstances,
  useMyAccessibleOrganizationUnits,
} from '@repo/data/react';
import {
  Button,
  DetailPageHeader,
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@repo/ui';
import { CalendarXIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
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

type DateFilter = 'next-week' | 'this-weekend' | null;

type OrganizationUnit =
  GetMyAccessibleOrganizationUnitsQuery['myAccessibleOrganizationUnits'][number];

interface DiscoverViewProps {
  initialAvailableShiftInstances: AvailableShiftInstance[];
  initialOrganizationUnits?: OrganizationUnit[];
}

export function DiscoverView({
  initialAvailableShiftInstances,
  initialOrganizationUnits,
}: DiscoverViewProps) {
  const t = useTranslations('VolunteerHome');
  const ct = useTranslations('Common');
  const { formatDate } = useFormatting();
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState<Date>(startOfDay(new Date()));

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

  const { data: availableShiftInstances, isLoading } =
    useAvailableShiftInstances(discoverOptions, {
      initialData: initialAvailableShiftInstances,
    });

  const showLoading = useDelayedLoading(isLoading);

  const availableShiftList = availableShiftInstances ?? [];
  const dayStrip = useMemo(
    () => getDayStripDays(availableShiftList),
    [availableShiftList],
  );
  const grouped = useMemo(
    () => groupByDay(availableShiftList),
    [availableShiftList],
  );
  const activeGroup = grouped.find(
    (group) => group.date.getTime() === activeDay.getTime(),
  );

  const hasActiveFilters = dateFilter !== null || selectedOrgUnitIds.length > 0;

  const toggleOrgUnit = (id: string) => {
    setSelectedOrgUnitIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <DetailPageHeader
        title={t('discoverHeading')}
        onBack={router.back}
        backLabel={ct('back')}
      />

      <div className="flex flex-wrap gap-2">
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

      {showLoading ? (
        <DayStripSkeleton />
      ) : (
        <DayStrip
          days={dayStrip}
          activeDate={activeDay}
          onSelect={setActiveDay}
          todayLabel={t('todayButton')}
        />
      )}

      {showLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : availableShiftList.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            {hasActiveFilters ? <SearchXIcon /> : <CalendarXIcon />}
          </EmptyMedia>
          <EmptyTitle>{t('discoverEmpty')}</EmptyTitle>
          {hasActiveFilters && (
            <EmptyDescription>{t('discoverEmptyBody')}</EmptyDescription>
          )}
          {!hasActiveFilters && (
            <Button asChild variant="default" size="lg">
              <Link href="/discover">{t('discoverCta')}</Link>
            </Button>
          )}
        </Empty>
      ) : activeGroup ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {formatDate(activeGroup.date, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            <span className="ml-2">{activeGroup.items.length}</span>
          </h3>
          <div className="space-y-3">
            {activeGroup.items.map((shift) =>
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
    </div>
  );
}
