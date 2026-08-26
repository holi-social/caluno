import type { EligibleTimeEntry } from '@repo/data';
import { format } from 'date-fns';
import type { EligibleHourLine } from '../components/eligible-hours-card';

/**
 * Extracts the year from the contract's manual "Vertragslaufzeit" field
 * (a coordinator-typed "MM/YYYY" string, e.g. "01/2026") and returns the full
 * calendar-year period the backend contract row covers — contracts always run
 * a whole calendar year, never just the entered month (see
 * board-data.utils.ts's `contractCoversRange`). Falls back to `now`'s year
 * when the string doesn't parse, so a malformed manual entry never blocks
 * contract creation.
 */
export function contractPeriodForLifespan(
  lifespan: string,
  now: Date = new Date(),
): { periodStart: string; periodEnd: string } {
  const match = lifespan.match(/(\d{4})\s*$/);
  const year = match ? Number(match[1]) : now.getFullYear();
  return {
    periodStart: new Date(Date.UTC(year, 0, 1)).toISOString(),
    periodEnd: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
  };
}

/** Hours between two ISO timestamps, rounded to hundredths so display never shows floating-point noise. */
export function hoursBetween(startedAt: string, endedAt: string): number {
  const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Maps a real eligible time entry (from `useEligibleTimeEntriesForInvoice`) to
 * the invoice modal's `EligibleHourLine` row shape — the same shape the
 * previous mock data used, so `EligibleHoursCard`'s check/uncheck behavior
 * keeps working unchanged.
 */
export function mapEligibleTimeEntry(
  entry: EligibleTimeEntry,
): EligibleHourLine {
  const start = new Date(entry.startedAt);
  const datePart = format(start, 'dd.MM.yyyy');
  const startTime = format(start, 'HH:mm');

  if (!entry.endedAt) {
    return {
      id: entry.id,
      shiftName: entry.shiftInstance?.master.title ?? entry.notes ?? '',
      dateTime: `${datePart}, ${startTime}`,
      hours: 0,
    };
  }

  const end = new Date(entry.endedAt);
  return {
    id: entry.id,
    shiftName: entry.shiftInstance?.master.title ?? entry.notes ?? '',
    dateTime: `${datePart}, ${startTime}–${format(end, 'HH:mm')}`,
    hours: hoursBetween(entry.startedAt, entry.endedAt),
  };
}
