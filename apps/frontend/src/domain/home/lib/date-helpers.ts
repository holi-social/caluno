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
