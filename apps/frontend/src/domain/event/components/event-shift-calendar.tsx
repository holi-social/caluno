'use client';

import type { RawPublicEvent } from '@repo/data';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DayStrip } from '@/domain/home/components/day-strip';
import { isSameDay } from '@/domain/home/lib/date-helpers';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { getEventDayRange } from '../lib/event-calendar-days';

type Shift = NonNullable<RawPublicEvent>['shifts'][number];
type Instance = Shift['instances'][number];

interface EventShiftCalendarProps {
  startsAt: string;
  endsAt: string;
  shifts: Shift[];
}

export function EventShiftCalendar({
  startsAt,
  endsAt,
  shifts,
}: EventShiftCalendarProps) {
  const t = useTranslations('EventDetail');
  const { formatTimeRange } = useFormatting();
  const days = useMemo(
    () => getEventDayRange(startsAt, endsAt),
    [startsAt, endsAt],
  );
  const [selectedDay, setSelectedDay] = useState(days[0] ?? new Date());

  const dayStripDays = useMemo(
    () =>
      days.map((day) => ({
        date: day,
        shiftCount: shifts.reduce((count, shift) => {
          return (
            count +
            shift.instances.filter((instance) =>
              isSameDay(new Date(instance.actualStartsAt), day),
            ).length
          );
        }, 0),
      })),
    [days, shifts],
  );

  const instancesOnDay: Array<{ instance: Instance; shift: Shift }> =
    useMemo(() => {
      return shifts.flatMap((shift) =>
        shift.instances
          .filter((instance) =>
            isSameDay(new Date(instance.actualStartsAt), selectedDay),
          )
          .map((instance) => ({ instance, shift })),
      );
    }, [shifts, selectedDay]);

  return (
    <div className="flex flex-col gap-4">
      <DayStrip
        days={dayStripDays}
        activeDate={selectedDay}
        onSelect={setSelectedDay}
        todayLabel={t('today')}
      />
      {instancesOnDay.length === 0 ? (
        <p className="text-muted-foreground">{t('noShiftsOnDay')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {instancesOnDay.map(({ instance, shift }) => (
            <li key={instance.id}>
              <Link
                href={`/shifts/${shift.id}`}
                className="block rounded-xl border border-border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {formatTimeRange(
                    instance.actualStartsAt,
                    instance.actualEndsAt,
                  )}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {instance.overrideTitle ?? shift.title}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
