import type { GetWeeklyShiftsQuery } from '@repo/data';
import { addDays, isSameDay } from 'date-fns';
import { getFormatter } from 'next-intl/server';
import { ShiftCard } from './shift-card';

type WeeklyCalendarProps = {
  instances: GetWeeklyShiftsQuery['weeklyShifts'];
  canManage?: boolean;
  weekStart: Date;
  orgUId: string;
};

export async function WeeklyCalendar({
  instances,
  canManage = false,
  weekStart,
  orgUId,
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
    <div className="bg-muted border border-border rounded-xl overflow-x-auto flex-1 min-h-80 snap-x snap-mandatory">
      <div className="flex items-stretch min-h-80 min-w-full h-full divide-x divide-border dark:divide-foreground/15">
        {days.map(({ date, label, dateLabel, instances: dayInstances }) => (
          <div
            key={date.toISOString()}
            className="flex flex-col gap-2 px-3 py-4 w-1/2 shrink-0 snap-start md:flex-1 md:w-auto md:min-w-0"
          >
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-bold text-muted-foreground">
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{dateLabel}</span>
            </div>

            {dayInstances.map((inst) => (
              <ShiftCard
                key={inst.id}
                instance={inst}
                canManage={canManage}
                orgUId={orgUId}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
