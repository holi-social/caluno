export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TimeRangeKind = 'ok' | 'overnight' | 'endNotAfterStart' | 'tooLong';

export function applyTimeToDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

function nextCalendarDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function resolveTimeRangeOnDate(
  calendarDate: Date,
  startTime: string,
  endTime: string,
  options: { allowOvernight?: boolean } = {},
): { start: Date; end: Date } {
  const start = applyTimeToDate(calendarDate, startTime);
  const sameDayEnd = applyTimeToDate(calendarDate, endTime);
  if (options.allowOvernight && sameDayEnd < start) {
    return {
      start,
      end: applyTimeToDate(nextCalendarDate(calendarDate), endTime),
    };
  }
  return { start, end: sameDayEnd };
}

export function classifyTimeRange(start: Date, end: Date): TimeRangeKind {
  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) {
    return 'endNotAfterStart';
  }
  if (durationMs >= MS_PER_DAY) {
    return 'tooLong';
  }
  const startClock = start.getHours() * 60 + start.getMinutes();
  const endClock = end.getHours() * 60 + end.getMinutes();
  if (endClock < startClock) {
    return 'overnight';
  }
  return 'ok';
}
