'use client';

import type { AvailableShiftInstancesInfiniteResult } from '@repo/data/react';
import {
  type AvailableShiftInstance,
  useAvailableShiftInstancesInfinite,
} from '@repo/data/react';
import { Button, Empty, EmptyMedia, EmptyTitle, Skeleton } from '@repo/ui';
import { CalendarXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  getDayStripDays,
  getDiscoverWindow,
  groupByDay,
} from '../lib/date-helpers';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { type DayGroup, DayTimelineView } from './day-timeline-view';
import { ShiftCardDiscovery } from './shift-card-discovery';

interface DiscoverViewProps {
  initialAvailableShiftInstancesPage?: AvailableShiftInstancesInfiniteResult;
}

export function DiscoverView({
  initialAvailableShiftInstancesPage,
}: DiscoverViewProps) {
  const t = useTranslations('VolunteerHome');
  const ct = useTranslations('Common');

  const discoverOptions = useMemo(() => getDiscoverWindow(), []);

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
    useAvailableShiftInstancesInfinite(discoverOptions, {
      initialData: initialAvailableShiftInstancesPage
        ? { pages: [initialAvailableShiftInstancesPage], pageParams: [0] }
        : undefined,
    });
  const showLoading = useDelayedLoading(isLoading);

  const availableShiftList = useMemo<AvailableShiftInstance[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const dayStrip = useMemo(
    () => getDayStripDays(availableShiftList, { minDays: 7 }),
    [availableShiftList],
  );
  const grouped = useMemo(
    () => groupByDay(availableShiftList),
    [availableShiftList],
  );

  const renderContent = (group: DayGroup<AvailableShiftInstance>) => (
    <div className="space-y-3">
      {group.items.map((shift) => (
        <ShiftCardDiscovery key={shift.id} shiftInstance={shift} />
      ))}
      {group.date.getTime() === grouped[grouped.length - 1]?.date.getTime() &&
        (hasNextPage || isFetching) && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchNextPage()}
              disabled={isFetching}
            >
              {isFetching ? ct('loading') : t('loadMore')}
            </Button>
          </div>
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
