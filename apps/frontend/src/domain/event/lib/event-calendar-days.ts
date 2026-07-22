import { tz } from '@date-fns/tz';
import { addDays as dfAddDays, startOfDay as dfStartOfDay } from 'date-fns';
import { DEFAULT_TIMEZONE } from '@/lib/formatting/formats';

const appTz = { in: tz(DEFAULT_TIMEZONE) } as const;

export function getEventDayRange(startsAt: string, endsAt: string): Date[] {
  const start = dfStartOfDay(new Date(startsAt), appTz);
  const end = dfStartOfDay(new Date(endsAt), appTz);
  const days: Date[] = [];
  let current = start;
  while (current.getTime() <= end.getTime()) {
    days.push(new Date(current));
    current = dfAddDays(current, 1, appTz);
  }
  return days;
}
