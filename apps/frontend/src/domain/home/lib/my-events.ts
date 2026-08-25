import { addDays, intervalsOverlap, startOfDay } from './date-helpers';

export type EventCardLayout = 'fill' | 'scroller';

/** npk49 rule: 1-2 events fill the row; 3+ become fixed-width scroller cards. */
export function getEventCardLayout(count: number): EventCardLayout {
  return count <= 2 ? 'fill' : 'scroller';
}

/**
 * Joined events whose [startsAt, endsAt) overlaps the rolling 7-day window
 * starting today. Overlap, not "starts within" — events are often
 * multi-day, so one already running when the week starts still counts.
 */
export function countEventsThisWeek(
  events: { startsAt: string; endsAt: string }[],
  now: Date,
): number {
  const windowStart = startOfDay(now);
  const windowEnd = addDays(windowStart, 7);
  return events.filter((event) =>
    intervalsOverlap(
      new Date(event.startsAt),
      new Date(event.endsAt),
      windowStart,
      windowEnd,
    ),
  ).length;
}
