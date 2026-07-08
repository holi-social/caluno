'use client';

import type { MyShiftInstance } from '@repo/data/react';
import { useCheckIn, useCheckOut, useMyShiftInstances } from '@repo/data/react';
import {
  Button,
  DetailPageHeader,
  Empty,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@repo/ui';
import { CalendarXIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  getDayStripDays,
  groupByDay,
  intervalsOverlap,
  startOfDay,
} from '../lib/date-helpers';
import { useDelayedLoading } from '../lib/use-delayed-loading';
import { DayStrip } from './day-strip';
import { DayStripSkeleton } from './day-strip-skeleton';
import { ShiftCardMy } from './shift-card-my';
import { ShiftCardMyFuture } from './shift-card-my-future';
import { ShiftCardMyPast } from './shift-card-my-past';

interface MyShiftsViewProps {
  initialMyShiftInstances: MyShiftInstance[];
}

export function MyShiftsView({ initialMyShiftInstances }: MyShiftsViewProps) {
  const t = useTranslations('VolunteerHome');
  const ct = useTranslations('Common');
  const { formatDate } = useFormatting();
  const router = useRouter();
  const [activeDay, setActiveDay] = useState<Date>(startOfDay(new Date()));
  const { mutate: checkIn } = useCheckIn();
  const { mutate: checkOut } = useCheckOut();

  const { data: myShiftInstances, isLoading } = useMyShiftInstances(true, {
    initialData: initialMyShiftInstances,
  });

  const showLoading = useDelayedLoading(isLoading);

  const myShiftList = myShiftInstances ?? [];
  const dayStrip = useMemo(
    () => getDayStripDays(myShiftList, { includePast: true }),
    [myShiftList],
  );
  const grouped = useMemo(() => groupByDay(myShiftList), [myShiftList]);

  const groupRefs = useRef<Map<number, HTMLHeadingElement>>(new Map());

  useEffect(() => {
    const heading = groupRefs.current.get(activeDay.getTime());
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeDay]);

  const now = new Date();
  const firstUpcomingIndex = myShiftList.findIndex(
    (shift) => new Date(shift.actualEndsAt).getTime() >= now.getTime(),
  );
  const nextShift =
    firstUpcomingIndex >= 0 ? myShiftList[firstUpcomingIndex] : null;
  const nextShiftId = nextShift?.id;

  return (
    <div className="flex flex-col gap-4">
      <DetailPageHeader
        title={t('yourShiftsHeading')}
        onBack={router.back}
        backLabel={ct('back')}
      />

      {showLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
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
        <>
          {nextShift &&
            activeDay.getTime() === startOfDay(new Date()).getTime() && (
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
            )}

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

          <div className="space-y-6">
            {grouped.map((group) => {
              const overlaps = new Set<string>();
              for (let i = 0; i < group.items.length; i++) {
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
                    overlaps.add(a.id);
                    overlaps.add(b.id);
                  }
                }
              }

              return (
                <div key={group.date.toISOString()} className="space-y-4">
                  <h3
                    ref={(el) => {
                      if (el) {
                        groupRefs.current.set(group.date.getTime(), el);
                      }
                    }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {formatDate(group.date, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                    <span className="ml-2">({group.items.length})</span>
                  </h3>
                  {overlaps.size > 0 && (
                    <p className="flex items-center gap-2 text-sm text-alert">
                      <TriangleAlertIcon
                        className="size-4"
                        aria-hidden="true"
                      />
                      {t('overlapWarning')}
                    </p>
                  )}
                  <div className="space-y-3">
                    {group.items.map((shift) => {
                      const isPast =
                        new Date(shift.actualEndsAt).getTime() < now.getTime();

                      if (shift.id === nextShiftId) {
                        return null;
                      }

                      if (isPast) {
                        return (
                          <ShiftCardMyPast
                            key={shift.id}
                            shiftInstance={shift}
                          />
                        );
                      }

                      return (
                        <ShiftCardMyFuture
                          key={shift.id}
                          shiftInstance={shift}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
