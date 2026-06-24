import type { GetMyTimeQuery } from '@repo/data';
import { addDays, startOfWeek } from 'date-fns';

export type TimeEntry = GetMyTimeQuery['myTime']['items'][number];

export type EntryState = 'in-progress' | 'completed';

export type WeekGroup = {
  weekStart: Date;
  weekEnd: Date;
  totalMinutes: number;
  entries: TimeEntry[];
};

export type GroupedMyTime = {
  allTimeMinutes: number;
  weeks: WeekGroup[];
};

export const getEntryState = (entry: TimeEntry): EntryState =>
  entry.endedAt ? 'completed' : 'in-progress';

export const entryDurationMinutes = (entry: TimeEntry): number => {
  if (!entry.endedAt) return 0;
  return Math.round(
    (new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()) /
      60000,
  );
};

export const groupMyTime = (entries: TimeEntry[]): GroupedMyTime => {
  const byWeek = new Map<number, TimeEntry[]>();
  let allTimeMinutes = 0;

  for (const entry of entries) {
    const weekStart = startOfWeek(new Date(entry.startedAt), {
      weekStartsOn: 1,
    });
    const key = weekStart.getTime();
    const bucket = byWeek.get(key);
    if (bucket) bucket.push(entry);
    else byWeek.set(key, [entry]);
    allTimeMinutes += entryDurationMinutes(entry);
  }

  const weeks = [...byWeek.entries()]
    .map(([key, weekEntries]) => {
      const weekStart = new Date(key);
      return {
        weekStart,
        weekEnd: addDays(weekStart, 6),
        totalMinutes: weekEntries.reduce(
          (sum, e) => sum + entryDurationMinutes(e),
          0,
        ),
        entries: weekEntries,
      };
    })
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

  return { allTimeMinutes, weeks };
};
