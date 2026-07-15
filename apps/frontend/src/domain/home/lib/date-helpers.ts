import { tz } from '@date-fns/tz';
import {
  addDays as dfAddDays,
  differenceInCalendarDays as dfDifferenceInCalendarDays,
  isSameDay as dfIsSameDay,
  startOfDay as dfStartOfDay,
} from 'date-fns';
import { DEFAULT_TIMEZONE } from '@/lib/formatting/formats';

// Day boundaries must be computed in the same timezone the app renders dates in
// (see formats.ts DEFAULT_TIMEZONE), otherwise grouping/"today" logic disagrees
// with the displayed day for viewers whose browser timezone differs.
const appTz = { in: tz(DEFAULT_TIMEZONE) } as const;

/** Number of days ahead the discover feed looks. */
export const DISCOVER_HORIZON_DAYS = 90;

export function startOfDay(date: Date): Date {
  return dfStartOfDay(date, appTz);
}

export function isSameDay(a: Date, b: Date): boolean {
  return dfIsSameDay(a, b, appTz);
}

export function addDays(date: Date, days: number): Date {
  return dfAddDays(date, days, appTz);
}

/** The discover query window: today → today + DISCOVER_HORIZON_DAYS (app tz). */
export function getDiscoverWindow(): { from: Date; to: Date } {
  const from = startOfDay(new Date());
  return { from, to: addDays(from, DISCOVER_HORIZON_DAYS) };
}

export function groupByDay<T extends { actualStartsAt: string }>(
  items: T[],
): Array<{ date: Date; items: T[] }> {
  const groups = new Map<string, { date: Date; items: T[] }>();

  for (const item of items) {
    const date = startOfDay(new Date(item.actualStartsAt));
    const key = date.toISOString();
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, { date, items: [item] });
    }
  }

  return [...groups.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export function getDayStripDays<T extends { actualStartsAt: string }>(
  items: T[],
  options: { includePast?: boolean; minDays?: number } = {},
): Array<{ date: Date; shiftCount: number }> {
  const today = startOfDay(new Date());
  const minDays = Math.max(1, options.minDays ?? 1);
  const grouped = groupByDay(items);

  // Default window: at least `minDays` starting today.
  let firstDate = today;
  let lastDate = addDays(today, minDays - 1);

  const firstGroup = grouped[0];
  const lastGroup = grouped[grouped.length - 1];
  if (firstGroup && lastGroup) {
    firstDate = firstGroup.date;
    lastDate = lastGroup.date;

    if (!options.includePast && firstDate.getTime() < today.getTime()) {
      firstDate = today;
    }

    // Guarantee the strip always spans at least `minDays` from its start.
    const minLast = addDays(firstDate, minDays - 1);
    if (lastDate.getTime() < minLast.getTime()) {
      lastDate = minLast;
    }
  }

  const days: Array<{ date: Date; shiftCount: number }> = [];
  const groupMap = new Map(
    grouped.map((group) => [
      startOfDay(group.date).toISOString(),
      group.items.length,
    ]),
  );

  for (
    let date = new Date(firstDate);
    date.getTime() <= lastDate.getTime();
    date = addDays(date, 1)
  ) {
    const key = startOfDay(date).toISOString();
    days.push({ date: new Date(date), shiftCount: groupMap.get(key) ?? 0 });
  }

  return days;
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type SparseDayStripEntry =
  | { type: 'day'; date: Date; shiftCount: number }
  | { type: 'gap'; key: string };

/**
 * A sparse day list for strips that should only show days that actually have
 * shifts (e.g. my-shifts), instead of `getDayStripDays`' contiguous window.
 * Adjacent shift-days (gap of exactly 1 day) render back-to-back; any wider
 * gap collapses to a single non-interactive "gap" marker instead of showing
 * every empty day in between.
 */
export function getSparseDayStripDays<T extends { actualStartsAt: string }>(
  items: T[],
): SparseDayStripEntry[] {
  const grouped = groupByDay(items);
  const result: SparseDayStripEntry[] = [];

  grouped.forEach((group, index) => {
    result.push({
      type: 'day',
      date: group.date,
      shiftCount: group.items.length,
    });

    const next = grouped[index + 1];
    if (next && dfDifferenceInCalendarDays(next.date, group.date, appTz) > 1) {
      result.push({ type: 'gap', key: `gap-${group.date.toISOString()}` });
    }
  });

  return result;
}

/**
 * The day matching `reference`, else the nearest one after it, else the last
 * one — the "today, or the closest upcoming day" pattern used both for the
 * initial scroll position and the "go to top" shortcut.
 */
export function getClosestShiftDayOnOrAfter<T extends { date: Date }>(
  groups: T[],
  reference: Date,
): T | undefined {
  const refStart = startOfDay(reference).getTime();
  return (
    groups.find((group) => startOfDay(group.date).getTime() === refStart) ??
    groups.find((group) => startOfDay(group.date).getTime() >= refStart) ??
    groups[groups.length - 1]
  );
}

export interface ShiftCluster<T> {
  /** Sorted by `actualStartsAt`. */
  items: T[];
  earliestStart: Date;
}

/**
 * Groups shifts into clusters of mutually-reachable overlapping time ranges
 * (a sweep over items sorted by start time, tracking the running max end of
 * the open cluster) — this correctly chains A-overlaps-B-overlaps-C into one
 * cluster even when A and C don't directly overlap, unlike a pairwise-only
 * check.
 */
export function clusterOverlappingShifts<
  T extends { actualStartsAt: string; actualEndsAt: string },
>(items: T[]): ShiftCluster<T>[] {
  const sorted = [...items].sort(
    (a, b) => +new Date(a.actualStartsAt) - +new Date(b.actualStartsAt),
  );

  const clusters: ShiftCluster<T>[] = [];
  let current: T[] = [];
  let currentEnd = -Infinity;

  const flush = () => {
    const first = current[0];
    if (first) {
      clusters.push({
        items: current,
        earliestStart: new Date(first.actualStartsAt),
      });
    }
  };

  for (const item of sorted) {
    const start = +new Date(item.actualStartsAt);
    const end = +new Date(item.actualEndsAt);
    if (current.length > 0 && start < currentEnd) {
      current.push(item);
      currentEnd = Math.max(currentEnd, end);
    } else {
      flush();
      current = [item];
      currentEnd = end;
    }
  }
  flush();

  return clusters;
}
