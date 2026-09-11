import type { GetWeeklyShiftsQuery } from '@repo/data';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { getDayInstances, getDaysForWeek } from '../lib/shift-instances';
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
  const { formatDate } = await getFormatting();

  const days: CalendarDay[] = getDaysForWeek(weekStart).map((date) => ({
    date,
    label: formatDate(date, { weekday: 'short' }),
    dateLabel: formatDate(date, { month: 'short', day: 'numeric' }),
    instances: getDayInstances(date, instances),
  }));

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
