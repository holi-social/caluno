'use client';

import type { MyShiftInstance } from '@repo/data/react';
import { useCheckIn, useCheckOut, useMyShiftInstances } from '@repo/data/react';
import { Button, Empty, EmptyMedia, EmptyTitle, Skeleton } from '@repo/ui';
import { CalendarXIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import {
  getDayStripDays,
  groupByDay,
  intervalsOverlap,
  startOfDay,
} from '../lib/date-helpers';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { type DayGroup, DayTimelineView } from './day-timeline-view';
import { ShiftCardMy } from './shift-card-my';
import { ShiftCardMyShift } from './shift-card-my-shift';

interface MyShiftsViewProps {
  initialMyShiftInstances: MyShiftInstance[];
}

export function MyShiftsView({ initialMyShiftInstances }: MyShiftsViewProps) {
  const t = useTranslations('VolunteerHome');
  const { mutate: checkIn } = useCheckIn();
  const { mutate: checkOut } = useCheckOut();

  const { data, isLoading } = useMyShiftInstances(true, {
    initialData: initialMyShiftInstances,
  });
  const showLoading = useDelayedLoading(isLoading);

  const myShiftList = data ?? [];
  const dayStrip = useMemo(
    () => getDayStripDays(myShiftList, { includePast: true, minDays: 7 }),
    [myShiftList],
  );
  const grouped = useMemo(() => groupByDay(myShiftList), [myShiftList]);

  const now = new Date();
  const firstUpcomingIndex = myShiftList.findIndex(
    (shift) => new Date(shift.actualEndsAt).getTime() >= now.getTime(),
  );
  const nextShiftId =
    firstUpcomingIndex >= 0 ? myShiftList[firstUpcomingIndex]?.id : undefined;

  const renderContent = (group: DayGroup<MyShiftInstance>) => {
    let hasOverlap = false;
    for (let i = 0; i < group.items.length && !hasOverlap; i++) {
      for (let j = i + 1; j < group.items.length; j++) {
        const a = group.items[i];
        const b = group.items[j];
        if (!a || !b) continue;
        if (
          intervalsOverlap(
            new Date(a.actualStartsAt),
            new Date(a.actualEndsAt),
            new Date(b.actualStartsAt),
            new Date(b.actualEndsAt),
          )
        ) {
          hasOverlap = true;
          break;
        }
      }
    }

    return (
      <>
        {hasOverlap && (
          <p className="flex items-center gap-2 text-sm text-alert">
            <TriangleAlertIcon className="size-4" aria-hidden="true" />
            {t('overlapWarning')}
          </p>
        )}
        <div className="space-y-3">
          {group.items.map((shift) => {
            const isPast =
              new Date(shift.actualEndsAt).getTime() < now.getTime();
            if (shift.id === nextShiftId) {
              return (
                <ShiftCardMy
                  key={shift.id}
                  shiftInstance={shift}
                  onCheckIn={() => checkIn(shift.id)}
                  onCheckOut={() => checkOut(shift.id)}
                />
              );
            }
            if (isPast) {
              return (
                <ShiftCardMyShift key={shift.id} shiftInstance={shift} past />
              );
            }
            return <ShiftCardMyShift key={shift.id} shiftInstance={shift} />;
          })}
        </div>
      </>
    );
  };

  return (
    <DayTimelineView
      title={t('yourShiftsHeading')}
      isLoading={showLoading}
      days={dayStrip}
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
      renderContent={renderContent}
      isDayDimmed={(group) => group.date.getTime() < startOfDay(now).getTime()}
    />
  );
}
