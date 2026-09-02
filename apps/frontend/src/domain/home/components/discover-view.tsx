'use client';

import type {
  AvailableEventsInfiniteResult,
  AvailableShiftInstancesInfiniteResult,
} from '@repo/data/react';
import {
  type AvailableShiftInstance,
  type DiscoverEvent,
  useAvailableEventsInfinite,
  useAvailableShiftInstancesInfinite,
} from '@repo/data/react';
import {
  Button,
  DetailPageHeader,
  Empty,
  EmptyMedia,
  EmptyTitle,
  SegmentedControl,
  Skeleton,
} from '@repo/ui';
import { CalendarXIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  getDayStripDays,
  getDiscoverWindow,
  groupByDay,
} from '../lib/date-helpers';
import { parseDiscoverTab } from '../lib/discover-tabs';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { type DayGroup, DayTimelineView } from './day-timeline-view';
import { EventCardDiscovery } from './event-card-discovery';
import { ShiftCardDiscovery } from './shift-card-discovery';

interface DiscoverViewProps {
  initialAvailableShiftInstancesPage?: AvailableShiftInstancesInfiniteResult;
  initialAvailableEventsPage?: AvailableEventsInfiniteResult;
}

export function DiscoverView({
  initialAvailableShiftInstancesPage,
  initialAvailableEventsPage,
}: DiscoverViewProps) {
  const t = useTranslations('VolunteerHome');
  const ct = useTranslations('Common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseDiscoverTab(searchParams.get('tab'));

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'events') {
      params.set('tab', 'events');
    } else {
      params.delete('tab');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const tabsControl = (
    <SegmentedControl
      size="lg"
      variant="line"
      triggerClassName="group-data-[size=lg]/tabs-list:text-base"
      value={tab}
      onChange={handleTabChange}
      options={[
        { value: 'assignments', label: t('discoverTabAssignments') },
        { value: 'events', label: t('discoverTabEvents') },
      ]}
    />
  );

  const discoverOptions = useMemo(() => getDiscoverWindow(), []);

  const {
    data: shiftData,
    isLoading: isLoadingShifts,
    isFetching: isFetchingShifts,
    hasNextPage: hasNextShiftsPage,
    fetchNextPage: fetchNextShiftsPage,
  } = useAvailableShiftInstancesInfinite(discoverOptions, {
    initialData: initialAvailableShiftInstancesPage
      ? { pages: [initialAvailableShiftInstancesPage], pageParams: [0] }
      : undefined,
  });
  const showLoadingShifts = useDelayedLoading(isLoadingShifts);

  const availableShiftList = useMemo<AvailableShiftInstance[]>(() => {
    if (!shiftData) return [];
    return shiftData.pages.flatMap((page) => page.items);
  }, [shiftData]);

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
      {group.items.map((shiftInstance) => (
        <ShiftCardDiscovery
          key={shiftInstance.id}
          shiftInstance={shiftInstance}
        />
      ))}
      {group.date.getTime() === grouped[grouped.length - 1]?.date.getTime() &&
        (hasNextShiftsPage || isFetchingShifts) && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchNextShiftsPage()}
              disabled={isFetchingShifts}
            >
              {isFetchingShifts ? ct('loading') : t('loadMore')}
            </Button>
          </div>
        )}
    </div>
  );

  const {
    data: eventData,
    isLoading: isLoadingEvents,
    isFetching: isFetchingEvents,
    hasNextPage: hasNextEventsPage,
    fetchNextPage: fetchNextEventsPage,
  } = useAvailableEventsInfinite(
    {},
    {
      initialData: initialAvailableEventsPage
        ? { pages: [initialAvailableEventsPage], pageParams: [0] }
        : undefined,
    },
  );
  const showLoadingEvents = useDelayedLoading(isLoadingEvents);

  const availableEventList = useMemo<DiscoverEvent[]>(() => {
    if (!eventData) return [];
    return eventData.pages.flatMap((page) => page.items);
  }, [eventData]);

  if (tab === 'events') {
    return (
      <div>
        <div className="sticky top-0 z-30 bg-muted">
          <div className="mx-auto w-full max-w-4xl">
            <DetailPageHeader
              className="bg-transparent"
              title={t('discoverHeading')}
              onBack={router.back}
              backLabel={ct('back')}
            />
            <div className="px-4 pb-0">{tabsControl}</div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          {showLoadingEvents ? (
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
              {(hasNextEventsPage || isFetchingEvents) && (
                <div className="col-span-full flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => fetchNextEventsPage()}
                    disabled={isFetchingEvents}
                  >
                    {isFetchingEvents ? ct('loading') : t('loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DayTimelineView
      title={t('discoverHeading')}
      headerContent={tabsControl}
      isLoading={showLoadingShifts}
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
