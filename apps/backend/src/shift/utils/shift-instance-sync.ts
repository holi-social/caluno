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
  actualEndsAt: Date;
  occurrenceIndex: number;
  restore: boolean;
}

export interface InstanceSyncPlan {
  toInsert: ShiftInstanceData[];
  toUpdate: InstanceUpdate[];
  toRemove: ShiftInstanceEntity[];
}

export function diffShiftInstances(
  existing: ShiftInstanceEntity[],
  target: ShiftInstanceData[],
): InstanceSyncPlan {
  // Matching is done by `actualStartsAt.toISOString()`, which compares UTC
  // instants. `expandShift` anchors occurrence times to `originalStartsAt`'s
  // timezone offset, so moving a series start across a DST transition shifts
  // post-transition occurrences by ±1h and they no longer match existing
  // instances (they get cancelled/deleted and re-inserted).
  // TODO: known follow-up, not handled here.
  const targetByStart = new Map(
    target.map((t) => [t.actualStartsAt.toISOString(), t]),
  );
  const existingStarts = new Set(
    existing.map((e) => e.actualStartsAt.toISOString()),
  );

  const toInsert = target.filter(
    (t) => !existingStarts.has(t.actualStartsAt.toISOString()),
  );

  const toUpdate: InstanceUpdate[] = [];
  const toRemove: ShiftInstanceEntity[] = [];

  for (const instance of existing) {
    const match = targetByStart.get(instance.actualStartsAt.toISOString());
    if (!match) {
      toRemove.push(instance);
      continue;
    }

    const restore = instance.isCancelled && instance.cancelledBySync;
    // Manually cancelled instances are left untouched by the resync.
    if (instance.isCancelled && !restore) {
      continue;
    }

    const endsChanged =
      instance.actualEndsAt.getTime() !== match.actualEndsAt.getTime();
    const indexChanged = instance.occurrenceIndex !== match.occurrenceIndex;

    if (restore || endsChanged || indexChanged) {
      toUpdate.push({
        id: instance.id,
        actualEndsAt: match.actualEndsAt,
        occurrenceIndex: match.occurrenceIndex,
        restore,
      });
    }
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
