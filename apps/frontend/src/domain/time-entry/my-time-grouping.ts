import { addDays, startOfWeek } from 'date-fns';

export type MyTimeEntry = {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  shiftName: string;
  organizationName: string;
  organizationUnitName: string;
};

export type EntryState = 'in-progress' | 'completed';

export type WeekGroup = {
  weekStart: Date;
  weekEnd: Date;
  totalMinutes: number;
  entries: MyTimeEntry[];
};

export type GroupedMyTime = {
  allTimeMinutes: number;
  weeks: WeekGroup[];
};

export const getEntryState = (entry: MyTimeEntry): EntryState =>
  entry.endedAt ? 'completed' : 'in-progress';

export const entryDurationMinutes = (entry: MyTimeEntry): number => {
  if (!entry.endedAt) return 0;
  return Math.round(
    (new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()) /
      60000,
  );
};

// Compact headline format for totals (all-time + per-week). Entry-level durations
// reuse the localized date-fns formatter in the row component; totals are headline numbers.
export const formatTotalMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const groupMyTime = (entries: MyTimeEntry[]): GroupedMyTime => {
  const byWeek = new Map<number, MyTimeEntry[]>();
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
