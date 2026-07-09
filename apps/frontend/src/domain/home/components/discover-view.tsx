'use client';

import type { AvailableShiftInstance } from '@repo/data/react';
import { useAvailableShiftInstances } from '@repo/data/react';
import { Empty, EmptyMedia, EmptyTitle, Skeleton } from '@repo/ui';
import { CalendarXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  addDays,
  getDayStripDays,
  groupByDay,
  startOfDay,
} from '../lib/date-helpers';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { type DayGroup, DayTimelineView } from './day-timeline-view';
import { ShiftCardDiscoveryEvent } from './shift-card-discovery-event';
import { ShiftCardDiscoverySolo } from './shift-card-discovery-solo';

interface DiscoverViewProps {
  initialAvailableShiftInstances: AvailableShiftInstance[];
}

export function DiscoverView({
  initialAvailableShiftInstances,
}: DiscoverViewProps) {
  const t = useTranslations('VolunteerHome');

  const discoverOptions = useMemo(
    () => ({
      from: startOfDay(new Date()),
      to: addDays(startOfDay(new Date()), 90),
    }),
    [],
  );

  const { data, isLoading } = useAvailableShiftInstances(discoverOptions, {
    initialData: initialAvailableShiftInstances,
  });
  const showLoading = useDelayedLoading(isLoading);

  const availableShiftList = data ?? [];
  const dayStrip = useMemo(
    () => getDayStripDays(availableShiftList),
    [availableShiftList],
  );
  const grouped = useMemo(
    () => groupByDay(availableShiftList),
    [availableShiftList],
  );

  const renderContent = (group: DayGroup<AvailableShiftInstance>) => (
    <div className="space-y-3">
      {group.items.map((shift) =>
        shift.master.event ? (
          <ShiftCardDiscoveryEvent key={shift.id} shiftInstance={shift} />
        ) : (
          <ShiftCardDiscoverySolo key={shift.id} shiftInstance={shift} />
        ),
      )}
    </div>
  );

  return (
    <DayTimelineView
      title={t('discoverHeading')}
      isLoading={showLoading}
      days={dayStrip}
      groups={grouped}
      hasContent={availableShiftList.length > 0}
      loading={
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      }
      empty={
        <Empty>
          <EmptyMedia variant="icon">
            <CalendarXIcon />
          </EmptyMedia>
          <EmptyTitle>{t('discoverEmptyHome')}</EmptyTitle>
        </Empty>
      }
      renderContent={renderContent}
    />
  );
}
