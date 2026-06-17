import { addDays, format } from 'date-fns';
import { getDataClient } from '@/lib/data-client';
import { ShiftCard } from './shift-card';

type WeeklyCalendarProps = {
  orgUId: string;
  canManage?: boolean;
  weekStart: Date;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function WeeklyCalendar({
  orgUId,
  canManage = false,
  weekStart,
}: WeeklyCalendarProps) {
  const weekEnd = addDays(weekStart, 7);

  const dataClient = await getDataClient(orgUId);
  const instances = await dataClient.shift.findForWeek(weekStart, weekEnd);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      label: DAY_LABELS[i],
      dateLabel: format(date, 'MMM. d'),
      instances: instances.filter((inst) =>
        isSameUtcDay(new Date(inst.actualStartsAt), date),
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
