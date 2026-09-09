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

export function getWeekRange(reference: Date): {
  weekStart: Date;
  weekEnd: Date;
} {
  const weekStart = getCurrentWeekStart(reference);
  return { weekStart, weekEnd: addDays(weekStart, 7, appTz) };
}

export function getDaysForWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index, appTz),
  );
}

export function getDayInstances<
  T extends { actualStartsAt: string; actualEndsAt: string },
>(day: Date, instances: T[]): T[] {
  return instances.filter((instance) =>
    isSameDay(new Date(instance.actualStartsAt), day, appTz),
  );
}
