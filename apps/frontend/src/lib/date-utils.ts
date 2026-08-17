import { startOfWeek } from 'date-fns';

export function parseWeekStart(
  param: string | null | undefined,
  fallback: Date = new Date(),
): Date {
  const base = param ? new Date(param) : fallback;
  const d = Number.isNaN(base.getTime()) ? fallback : base;
  return startOfWeek(d, { weekStartsOn: 1 });
}
