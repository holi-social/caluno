import { useFormatter } from 'next-intl';
import { formatTotalMinutes } from '../formating';
import type { WeekGroup } from '../my-time-grouping';
import { MyTimeEntryRow } from './my-time-entry-row';

const weekRangeOptions = { month: 'short', day: 'numeric' } as const;
const weekRangeEndOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
} as const;

export const MyTimeWeekGroup = ({ week }: { week: WeekGroup }) => {
  const formatter = useFormatter();
  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between px-1 text-sm font-semibold text-muted-foreground">
        <span>
          {formatter.dateTime(week.weekStart, weekRangeOptions)} –{' '}
          {formatter.dateTime(week.weekEnd, weekRangeEndOptions)}
        </span>
        <span className="tabular-nums">
          {formatTotalMinutes(week.totalMinutes)}
        </span>
      </header>
      <div className="space-y-2">
        {week.entries.map((entry) => (
          <MyTimeEntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
};
