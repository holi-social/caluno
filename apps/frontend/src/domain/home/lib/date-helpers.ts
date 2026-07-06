export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getNextWeekRange(now = new Date()): { from: Date; to: Date } {
  const from = startOfDay(addDays(now, 1));
  const to = startOfDay(addDays(now, 8));
  to.setMilliseconds(-1);
  return { from, to };
}

export function getThisWeekendRange(now = new Date()): {
  from: Date;
  to: Date;
} {
  const day = now.getDay();
  const daysUntilSaturday = day === 6 ? 0 : 6 - day;
  const daysUntilSunday = day === 0 ? 0 : 7 - day;

  const from = startOfDay(addDays(now, daysUntilSaturday));
  const to = startOfDay(addDays(now, daysUntilSunday + 1));
  to.setMilliseconds(-1);
  return { from, to };
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
  options: { includePast?: boolean } = {},
): Array<{ date: Date; shiftCount: number }> {
  const today = startOfDay(new Date());
  const grouped = groupByDay(items);

  if (grouped.length === 0) {
    return [{ date: today, shiftCount: 0 }];
  }

  const firstGroup = grouped[0];
  const lastGroup = grouped[grouped.length - 1];
  if (!firstGroup || !lastGroup) {
    return [{ date: today, shiftCount: 0 }];
  }

  let firstDate = firstGroup.date;
  const lastDate = lastGroup.date;

  if (!options.includePast && firstDate.getTime() < today.getTime()) {
    firstDate = today;
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
