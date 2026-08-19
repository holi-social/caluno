import type { GetWeeklyShiftsQuery } from '@repo/data';
import { addDays, isSameDay } from 'date-fns';
import { getFormatter } from 'next-intl/server';
import { ShiftCard } from './shift-card';

type WeeklyShiftInstance = GetWeeklyShiftsQuery['weeklyShifts'][number];

type WeeklyCalendarProps = {
  instances: GetWeeklyShiftsQuery['weeklyShifts'];
  canManage?: boolean;
  weekStart: Date;
  orgUId: string;
};

type CalendarDay = {
  date: Date;
  label: string;
  dateLabel: string;
  instances: WeeklyShiftInstance[];
};

function WeeklyCalendarDay({
  day,
  canManage,
  orgUId,
}: {
  day: CalendarDay;
  canManage: boolean;
  orgUId: string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2 px-2 py-4 snap-start">
      <header className="flex items-baseline justify-between px-1">
        <span className="text-sm font-bold text-muted-foreground">
          {day.label}
        </span>
        <span className="text-xs text-muted-foreground">{day.dateLabel}</span>
      </header>

      {day.instances.map((inst) => (
        <ShiftCard
          key={inst.id}
          instance={inst}
          canManage={canManage}
          orgUId={orgUId}
        />
      ))}
    </section>
  );
}

export async function WeeklyCalendar({
  instances,
  canManage = false,
  weekStart,
  orgUId,
}: WeeklyCalendarProps) {
  const formatter = await getFormatter();

  const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
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
      <div className="grid min-h-80 min-w-full h-full grid-cols-[repeat(7,minmax(50%,1fr))] divide-x divide-border dark:divide-foreground/15 md:grid-cols-7">
        {days.map((day) => (
          <WeeklyCalendarDay
            key={day.date.toISOString()}
            day={day}
            canManage={canManage}
            orgUId={orgUId}
          />
        ))}
      </div>
    </div>
  );
}
