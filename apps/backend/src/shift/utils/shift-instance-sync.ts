import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import * as schema from '../../database/schema';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import type { ShiftInstanceData } from './rrule-expander';

export function filterFromDate<T extends { actualStartsAt: Date }>(
  items: T[],
  fromDate?: Date,
): T[] {
  if (!fromDate) return items;
  return items.filter((item) => item.actualStartsAt >= fromDate);
}

export interface InstanceUpdate {
  id: string;
  actualStartsAt: Date;
  actualEndsAt: Date;
  occurrenceIndex: number;
  restore: boolean;
}

export interface InstanceSyncPlan {
  toInsert: ShiftInstanceData[];
  toUpdate: InstanceUpdate[];
  toRemove: ShiftInstanceEntity[];
}

/**
 * Calendar-day identity for an instance start.
 *
 * `actual_starts_at` is a `timestamp` without time zone, so node-postgres
 * hands back a Date in server-local wall-clock — the same frame the local
 * getters and SQL's `date_trunc('day', ...)` work in. Never key days off
 * `toISOString()`, which would reintroduce a UTC/local mismatch.
 */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function groupByDay<T extends { actualStartsAt: Date }>(
  items: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = localDateKey(item.actualStartsAt);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  for (const bucket of groups.values()) {
    bucket.sort(
      (a, b) => a.actualStartsAt.getTime() - b.actualStartsAt.getTime(),
    );
  }
  return groups;
}

/**
 * Matches existing rows to regenerated occurrences by CALENDAR DAY, not by
 * exact instant. A day present on both sides keeps its row and moves it to
 * the new time, so invites and time entries survive an edit that changes the
 * recurrence weekdays and the time-of-day together.
 *
 * Days that hold more than one occurrence are not reachable via
 * `generateRrule` (no BYHOUR), so chronological pairing is purely defensive
 * against rrule strings from other sources.
 */
export function diffShiftInstances(
  existing: ShiftInstanceEntity[],
  target: ShiftInstanceData[],
): InstanceSyncPlan {
  const existingByDay = groupByDay(existing);
  const targetByDay = groupByDay(target);

  const toInsert: ShiftInstanceData[] = [];
  const toUpdate: InstanceUpdate[] = [];
  const toRemove: ShiftInstanceEntity[] = [];

  for (const [day, targets] of targetByDay) {
    const instances = existingByDay.get(day) ?? [];

    for (let i = 0; i < targets.length; i++) {
      const match = targets[i];
      const instance = instances[i];
      if (!match) continue;

      if (!instance) {
        toInsert.push(match);
        continue;
      }

      const restore = instance.isCancelled && instance.cancelledBySync;
      // Manually cancelled instances are left untouched by the resync — and
      // because their day still matched, no replacement row is inserted
      // beside them.
      if (instance.isCancelled && !restore) {
        continue;
      }

      const startsChanged =
        instance.actualStartsAt.getTime() !== match.actualStartsAt.getTime();
      const endsChanged =
        instance.actualEndsAt.getTime() !== match.actualEndsAt.getTime();
      const indexChanged = instance.occurrenceIndex !== match.occurrenceIndex;

      if (restore || startsChanged || endsChanged || indexChanged) {
        toUpdate.push({
          id: instance.id,
          actualStartsAt: match.actualStartsAt,
          actualEndsAt: match.actualEndsAt,
          occurrenceIndex: match.occurrenceIndex,
          restore,
        });
      }
    }

    // Surplus rows on a day the target still covers.
    for (let i = targets.length; i < instances.length; i++) {
      const surplus = instances[i];
      if (!surplus) continue;
      // Manually cancelled instances are left untouched by the resync, same
      // as the matched-pair branch above.
      if (surplus.isCancelled && !surplus.cancelledBySync) continue;
      toRemove.push(surplus);
    }
  }

  // Whole days the target no longer covers.
  for (const [day, instances] of existingByDay) {
    if (targetByDay.has(day)) continue;
    toRemove.push(...instances);
  }

  return { toInsert, toUpdate, toRemove };
}

export async function syncShiftInstances(
  tx: Pick<Database, 'select' | 'insert' | 'update' | 'delete' | 'query'>,
  masterId: string,
  target: ShiftInstanceData[],
  options: { fromDate?: Date } = {},
): Promise<void> {
  const { fromDate } = options;

  const existing = await tx.query.shiftInstances.findMany({
    where: {
      masterId,
      isException: false,
      ...(fromDate ? { actualStartsAt: { gte: fromDate } } : {}),
    },
  });

  const exceptions = await tx.query.shiftInstances.findMany({
    where: { masterId, isException: true },
    columns: { actualStartsAt: true },
  });
  const exceptionStarts = new Set(
    exceptions.map((e) => e.actualStartsAt.toISOString()),
  );

  const filteredTarget = filterFromDate(target, fromDate);
  const plan = diffShiftInstances(existing, filteredTarget);

  // TODO(instance-editing): reconcile exception instances with the series
  // instead of just skipping their dates:
  // syncShiftInstances() only loads and diffs non-exception instances —
  // exceptions are user-made one-offs and the sync must never rewrite or
  // delete them.
  // - But there's a collision risk: if an exception instance sits at a date
  // that the regenerated series also produces, the sync would insert a fresh
  // regular instance at that same date → two instances at the same wall time.
  const toInsert = plan.toInsert.filter(
    (i) => !exceptionStarts.has(i.actualStartsAt.toISOString()),
  );

  if (toInsert.length > 0) {
    await tx.insert(schema.shiftInstances).values(
      toInsert.map((inst) => ({
        masterId,
        actualStartsAt: inst.actualStartsAt,
        actualEndsAt: inst.actualEndsAt,
        occurrenceIndex: inst.occurrenceIndex,
      })),
    );
  }

  for (const update of plan.toUpdate) {
    await tx
      .update(schema.shiftInstances)
      .set({
        actualEndsAt: update.actualEndsAt,
        occurrenceIndex: update.occurrenceIndex,
        ...(update.restore
          ? { isCancelled: false, cancelledBySync: false }
          : {}),
      })
      .where(eq(schema.shiftInstances.id, update.id));
  }

  if (plan.toRemove.length === 0) {
    return;
  }

  const removeIds = plan.toRemove.map((i) => i.id);

  const invites = await tx
    .select({ instanceId: schema.shiftInstanceInvites.instanceId })
    .from(schema.shiftInstanceInvites)
    .where(inArray(schema.shiftInstanceInvites.instanceId, removeIds));

  const timeEntries = await tx
    .select({ instanceId: schema.timeEntries.shiftInstanceId })
    .from(schema.timeEntries)
    .where(inArray(schema.timeEntries.shiftInstanceId, removeIds));

  // We protect instances that are already cancelled, have invites,
  // or have time entries from being deleted. They will be marked
  // as cancelled instead — except manually cancelled ones, which are
  // already cancelled and must keep cancelledBySync: false so a later
  // re-expansion does not "restore" them.
  const protectedIds = new Set<string>([
    ...plan.toRemove.filter((i) => i.isCancelled).map((i) => i.id),
    ...invites.map((i) => i.instanceId),
    ...timeEntries.map((e) => e.instanceId),
  ]);

  const toCancelIds = plan.toRemove
    .filter(
      (i) => protectedIds.has(i.id) && !(i.isCancelled && !i.cancelledBySync),
    )
    .map((i) => i.id);
  const toDeleteIds = removeIds.filter((id) => !protectedIds.has(id));

  if (toCancelIds.length > 0) {
    await tx
      .update(schema.shiftInstances)
      .set({ isCancelled: true, cancelledBySync: true })
      .where(inArray(schema.shiftInstances.id, toCancelIds));
  }

  if (toDeleteIds.length > 0) {
    await tx
      .delete(schema.shiftInstances)
      .where(inArray(schema.shiftInstances.id, toDeleteIds));
  }
}
