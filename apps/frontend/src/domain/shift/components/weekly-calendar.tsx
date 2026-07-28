import type { GetWeeklyShiftsQuery } from '@repo/data';
import { addDays, isSameDay } from 'date-fns';
import { getFormatter } from 'next-intl/server';
import { ShiftCard } from './shift-card';

type WeeklyCalendarProps = {
  instances: GetWeeklyShiftsQuery['weeklyShifts'];
  canManage?: boolean;
  weekStart: Date;
};

export async function WeeklyCalendar({
  instances,
  canManage = false,
  weekStart,
}: WeeklyCalendarProps) {
  const formatter = await getFormatter();

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      label: formatter.dateTime(date, { weekday: 'short' }),
      dateLabel: formatter.dateTime(date, { month: 'short', day: 'numeric' }),
      instances: instances.filter((inst) =>
        isSameDay(new Date(inst.actualStartsAt), date),
      ),
    };
  });

  return (
    <div className="bg-muted border border-border rounded-xl px-3 py-4 overflow-x-auto flex-1 snap-x snap-mandatory scroll-pl-3">
      <div className="flex gap-3 items-start min-w-full">
        {days.map(({ date, label, dateLabel, instances: dayInstances }) => (
          <div
            key={date.toISOString()}
            className="flex flex-col gap-2 w-[calc(50%_-_var(--spacing)_*_1.5)] shrink-0 snap-start md:flex-1 md:w-auto md:min-w-0"
          >
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-bold text-muted-foreground">
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{dateLabel}</span>
            </div>

            {dayInstances.map((inst) => (
              <ShiftCard key={inst.id} instance={inst} canManage={canManage} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
