'use client';

import type { GroupedMyTime } from '../my-time-grouping';
import { MyTimeSummary } from './my-time-summary';
import { MyTimeWeekGroup } from './my-time-week-group';

export const MyTimeView = ({ grouped }: { grouped: GroupedMyTime }) => {
  return (
    <div className="space-y-6">
      <MyTimeSummary allTimeMinutes={grouped.allTimeMinutes} />
      <div className="space-y-6">
        {grouped.weeks.map((week) => (
          <MyTimeWeekGroup key={week.weekStart.toISOString()} week={week} />
        ))}
      </div>
    </div>
  );
};
