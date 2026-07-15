'use client';

import type { MyShiftInstance } from '@repo/data/react';
import { useMyShiftInstances } from '@repo/data/react';
import { Button, Empty, EmptyMedia, EmptyTitle, Skeleton } from '@repo/ui';
import { CalendarXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import {
  getDayStripDays,
  getSparseDayStripDays,
  groupByDay,
  startOfDay,
} from '../lib/date-helpers';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { DayTimelineView } from './day-timeline-view';
import { MyShiftsDayRows } from './my-shifts-day-rows';

interface MyShiftsViewProps {
  initialMyShiftInstances: MyShiftInstance[];
}

export function MyShiftsView({ initialMyShiftInstances }: MyShiftsViewProps) {
  const t = useTranslations('VolunteerHome');

  const { data, isLoading } = useMyShiftInstances(true, {
    initialData: initialMyShiftInstances,
  });
  const showLoading = useDelayedLoading(isLoading);

  const myShiftList = data ?? [];
  const dayStrip = useMemo(
    () => getDayStripDays(myShiftList, { includePast: true, minDays: 7 }),
    [myShiftList],
  );
  const sparseDayStrip = useMemo(
    () => getSparseDayStripDays(myShiftList),
    [myShiftList],
  );
  const grouped = useMemo(() => groupByDay(myShiftList), [myShiftList]);

  const now = new Date();
  const firstUpcomingIndex = myShiftList.findIndex(
    (shift) => new Date(shift.actualEndsAt).getTime() >= now.getTime(),
  );
  const nextShiftId =
    firstUpcomingIndex >= 0 ? myShiftList[firstUpcomingIndex]?.id : undefined;

  return (
    <DayTimelineView
      title={t('yourShiftsHeading')}
      isLoading={showLoading}
      days={dayStrip}
      sparseDays={sparseDayStrip}
      goToTopLabel={t('goToTop')}
      groups={grouped}
      hasContent={myShiftList.length > 0}
      loading={
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      }
      empty={
        <Empty>
          <EmptyMedia variant="icon">
            <CalendarXIcon />
          </EmptyMedia>
          <EmptyTitle>{t('yourShiftsEmpty')}</EmptyTitle>
          <Button asChild variant="default" size="lg">
            <Link href="/discover">{t('discoverCta')}</Link>
          </Button>
        </Empty>
      }
      renderContent={(group) => (
        <MyShiftsDayRows group={group} nextShiftId={nextShiftId} now={now} />
      )}
      isDayDimmed={(group) => group.date.getTime() < startOfDay(now).getTime()}
    />
  );
}
