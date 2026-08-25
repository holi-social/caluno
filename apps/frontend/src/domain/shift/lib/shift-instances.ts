import { tz } from '@date-fns/tz';
import { addDays, isSameDay, startOfWeek } from 'date-fns';
import { DEFAULT_TIMEZONE } from '@/lib/formatting/formats';

const appTz = { in: tz(DEFAULT_TIMEZONE) };

export interface ShiftInstanceDay {
  date: Date;
  instances: Array<{
    id: string;
    actualStartsAt: string;
    actualEndsAt: string;
  }>;
}

export function getCurrentWeekStart(reference: Date): Date {
  return startOfWeek(reference, { weekStartsOn: 1, ...appTz });
}

export function getDaysForWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index, appTz),
  );
}

export function getDayInstances(
  day: Date,
  instances: Array<{
    id: string;
    actualStartsAt: string;
    actualEndsAt: string;
  }>,
): Array<{ id: string; actualStartsAt: string; actualEndsAt: string }> {
  return instances.filter((instance) =>
    isSameDay(new Date(instance.actualStartsAt), day, appTz),
  );
}
