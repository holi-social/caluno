import type { WeeklyShiftInstance } from '@repo/data';

/**
 * The minimal shape of a shift occurrence the "Add time entry" picker needs in
 * order to identify a specific day. Kept free of React and of the generated
 * GraphQL types so the display/filtering rules can be unit-tested in
 * isolation.
 */
export type TimeEntryShiftInstance = {
  id: string;
  masterId: string;
  title: string;
  actualStartsAt: string;
  actualEndsAt: string;
};

/**
 * Map a raw shift instance into the minimal display shape. The admin-facing
 * title prefers the per-occurrence override and falls back to the series name.
 */
export function toTimeEntryShiftInstance(
  raw: WeeklyShiftInstance,
): TimeEntryShiftInstance {
  return {
    id: raw.id,
    masterId: raw.master.id,
    title: raw.overrideTitle ?? raw.master.title,
    actualStartsAt: raw.actualStartsAt,
    actualEndsAt: raw.actualEndsAt,
  };
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** The instances that run on the given calendar day. */
export function instancesOnDate(
  instances: TimeEntryShiftInstance[],
  date: Date,
): TimeEntryShiftInstance[] {
  return instances.filter((i) => isSameDay(new Date(i.actualStartsAt), date));
}

/** Stable ordering: earliest start first within a day. */
export function sortByStartsAt(
  instances: TimeEntryShiftInstance[],
): TimeEntryShiftInstance[] {
  return [...instances].sort(
    (a, b) =>
      new Date(a.actualStartsAt).getTime() -
      new Date(b.actualStartsAt).getTime(),
  );
}

/** Filter a list of instances by a case-insensitive title substring. */
export function filterByTitle(
  instances: TimeEntryShiftInstance[],
  search: string,
): TimeEntryShiftInstance[] {
  const query = search.trim().toLowerCase();
  if (!query) return instances;
  return instances.filter((i) => i.title.toLowerCase().includes(query));
}
