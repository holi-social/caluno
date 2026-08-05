import { describe, expect, it } from 'bun:test';
import type { ShiftInstanceEntity } from '../src/shift/schemas/shift-instance.schema';
import type { ShiftInstanceData } from '../src/shift/utils/rrule-expander';
import { diffShiftInstances } from '../src/shift/utils/shift-instance-sync';

const makeInstance = (
  overrides: Partial<ShiftInstanceEntity> & { actualStartsAt: Date },
): ShiftInstanceEntity =>
  ({
    id: crypto.randomUUID(),
    masterId: 'master-id',
    actualEndsAt: new Date(overrides.actualStartsAt.getTime() + 120 * 60000),
    occurrenceIndex: 0,
    isException: false,
    isCancelled: false,
    cancelledBySync: false,
    ...overrides,
  }) as ShiftInstanceEntity;

const makeTarget = (
  actualStartsAt: Date,
  occurrenceIndex = 0,
  durationMinutes = 120,
): ShiftInstanceData => ({
  actualStartsAt,
  actualEndsAt: new Date(actualStartsAt.getTime() + durationMinutes * 60000),
  occurrenceIndex,
});

const T0 = new Date('2026-07-01T08:00:00.000Z');
const T1 = new Date('2026-07-02T08:00:00.000Z');

describe('diffShiftInstances', () => {
  it('marks target occurrences with no existing instance as toInsert', () => {
    const plan = diffShiftInstances([], [makeTarget(T0), makeTarget(T1, 1)]);
    expect(plan.toInsert).toHaveLength(2);
    expect(plan.toUpdate).toHaveLength(0);
    expect(plan.toRemove).toHaveLength(0);
  });

  it('marks existing instances with no target occurrence as toRemove', () => {
    const plan = diffShiftInstances([makeInstance({ actualStartsAt: T0 })], []);
    expect(plan.toRemove).toHaveLength(1);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('keeps identical matches out of the plan', () => {
    const plan = diffShiftInstances(
      [makeInstance({ actualStartsAt: T0, occurrenceIndex: 0 })],
      [makeTarget(T0, 0)],
    );
    expect(plan.toInsert).toHaveLength(0);
    expect(plan.toUpdate).toHaveLength(0);
    expect(plan.toRemove).toHaveLength(0);
  });

  it('updates endsAt and occurrenceIndex when they changed', () => {
    const instance = makeInstance({ actualStartsAt: T0, occurrenceIndex: 0 });
    const plan = diffShiftInstances(
      [instance],
      [makeTarget(T0, 3, 180)], // same start, new index + 3h duration
    );
    expect(plan.toUpdate).toEqual([
      {
        id: instance.id,
        actualStartsAt: T0,
        actualEndsAt: new Date(T0.getTime() + 180 * 60000),
        occurrenceIndex: 3,
        restore: false,
      },
    ]);
  });

  it('restores sync-cancelled matches but never manually cancelled ones', () => {
    const syncCancelled = makeInstance({
      actualStartsAt: T0,
      isCancelled: true,
      cancelledBySync: true,
    });
    const manuallyCancelled = makeInstance({
      actualStartsAt: T1,
      isCancelled: true,
      cancelledBySync: false,
    });
    const plan = diffShiftInstances(
      [syncCancelled, manuallyCancelled],
      [makeTarget(T0, 0), makeTarget(T1, 1)],
    );
    expect(plan.toUpdate).toEqual([
      {
        id: syncCancelled.id,
        actualStartsAt: T0,
        actualEndsAt: syncCancelled.actualEndsAt,
        occurrenceIndex: 0,
        restore: true,
      },
    ]);
  });

  it('moves a matched instance in place when the time-of-day changed', () => {
    // The reported bug: weekday set AND time-of-day changed in one save.
    // T0 (Wed) survives at a new time, T1 (Thu) is dropped, T2 (Fri) is new.
    const T2 = new Date('2026-07-03T08:00:00.000Z');
    const survivor = makeInstance({ actualStartsAt: T0, occurrenceIndex: 0 });
    const dropped = makeInstance({ actualStartsAt: T1, occurrenceIndex: 1 });

    const movedT0 = new Date(T0.getTime() + 4 * 60 * 60000); // same day, +4h
    const movedT2 = new Date(T2.getTime() + 4 * 60 * 60000);

    const plan = diffShiftInstances(
      [survivor, dropped],
      [makeTarget(movedT0, 0), makeTarget(movedT2, 1)],
    );

    expect(plan.toUpdate).toEqual([
      {
        id: survivor.id,
        actualStartsAt: movedT0,
        actualEndsAt: new Date(movedT0.getTime() + 120 * 60000),
        occurrenceIndex: 0,
        restore: false,
      },
    ]);
    expect(plan.toRemove.map((i) => i.id)).toEqual([dropped.id]);
    expect(plan.toInsert.map((i) => i.actualStartsAt)).toEqual([movedT2]);
  });

  it('moves every matched instance when only the time-of-day changed', () => {
    const first = makeInstance({ actualStartsAt: T0, occurrenceIndex: 0 });
    const second = makeInstance({ actualStartsAt: T1, occurrenceIndex: 1 });
    const movedT0 = new Date(T0.getTime() + 90 * 60000);
    const movedT1 = new Date(T1.getTime() + 90 * 60000);

    const plan = diffShiftInstances(
      [first, second],
      [makeTarget(movedT0, 0), makeTarget(movedT1, 1)],
    );

    expect(plan.toUpdate.map((u) => u.actualStartsAt)).toEqual([
      movedT0,
      movedT1,
    ]);
    expect(plan.toRemove).toHaveLength(0);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('still removes and inserts when only the days changed', () => {
    const T2 = new Date('2026-07-03T08:00:00.000Z');
    const dropped = makeInstance({ actualStartsAt: T1, occurrenceIndex: 1 });
    const kept = makeInstance({ actualStartsAt: T0, occurrenceIndex: 0 });

    const plan = diffShiftInstances(
      [kept, dropped],
      [makeTarget(T0, 0), makeTarget(T2, 1)],
    );

    expect(plan.toUpdate).toHaveLength(0);
    expect(plan.toRemove.map((i) => i.id)).toEqual([dropped.id]);
    expect(plan.toInsert.map((i) => i.actualStartsAt)).toEqual([T2]);
  });

  it('leaves a manually cancelled day alone and does not insert beside it', () => {
    const manuallyCancelled = makeInstance({
      actualStartsAt: T0,
      isCancelled: true,
      cancelledBySync: false,
    });
    const movedT0 = new Date(T0.getTime() + 4 * 60 * 60000);

    const plan = diffShiftInstances([manuallyCancelled], [makeTarget(movedT0)]);

    expect(plan.toUpdate).toHaveLength(0);
    expect(plan.toRemove).toHaveLength(0);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('restores and moves a sync-cancelled instance whose time changed', () => {
    const syncCancelled = makeInstance({
      actualStartsAt: T0,
      isCancelled: true,
      cancelledBySync: true,
    });
    const movedT0 = new Date(T0.getTime() + 4 * 60 * 60000);

    const plan = diffShiftInstances([syncCancelled], [makeTarget(movedT0)]);

    expect(plan.toUpdate).toEqual([
      {
        id: syncCancelled.id,
        actualStartsAt: movedT0,
        actualEndsAt: new Date(movedT0.getTime() + 120 * 60000),
        occurrenceIndex: 0,
        restore: true,
      },
    ]);
    expect(plan.toRemove).toHaveLength(0);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('matches an occurrence knocked an hour off by a DST transition', () => {
    // expandShift anchors occurrences to originalStartsAt's offset, so a
    // series crossing a DST boundary lands post-transition occurrences ±1h
    // from the stored rows. This is the shape that produced: same calendar
    // day, one hour apart. It must match rather than be rebuilt. (Uses local
    // constructors so the assertion holds in any server timezone.)
    const beforeShift = new Date(2026, 3, 5, 9, 0, 0, 0); // local 09:00
    const afterShift = new Date(2026, 3, 5, 10, 0, 0, 0); // local 10:00, same day
    const instance = makeInstance({ actualStartsAt: beforeShift });

    const plan = diffShiftInstances([instance], [makeTarget(afterShift)]);

    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0]?.actualStartsAt).toEqual(afterShift);
    expect(plan.toRemove).toHaveLength(0);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('pairs multiple occurrences on one day in chronological order', () => {
    const morning = new Date(2026, 6, 1, 9, 0, 0, 0);
    const evening = new Date(2026, 6, 1, 18, 0, 0, 0);
    const newMorning = new Date(2026, 6, 1, 10, 0, 0, 0);
    const newEvening = new Date(2026, 6, 1, 19, 0, 0, 0);

    // Deliberately unsorted inputs: pairing must not depend on input order.
    const eveningInstance = makeInstance({
      actualStartsAt: evening,
      occurrenceIndex: 1,
    });
    const morningInstance = makeInstance({
      actualStartsAt: morning,
      occurrenceIndex: 0,
    });

    const plan = diffShiftInstances(
      [eveningInstance, morningInstance],
      [makeTarget(newEvening, 1), makeTarget(newMorning, 0)],
    );

    const byId = new Map(plan.toUpdate.map((u) => [u.id, u.actualStartsAt]));
    expect(byId.get(morningInstance.id)).toEqual(newMorning);
    expect(byId.get(eveningInstance.id)).toEqual(newEvening);
    expect(plan.toRemove).toHaveLength(0);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('removes the surplus when a day has more existing rows than targets', () => {
    const morning = new Date(2026, 6, 1, 9, 0, 0, 0);
    const evening = new Date(2026, 6, 1, 18, 0, 0, 0);
    const morningInstance = makeInstance({ actualStartsAt: morning });
    const eveningInstance = makeInstance({ actualStartsAt: evening });

    const plan = diffShiftInstances(
      [morningInstance, eveningInstance],
      [makeTarget(morning)],
    );

    expect(plan.toRemove.map((i) => i.id)).toEqual([eveningInstance.id]);
    expect(plan.toInsert).toHaveLength(0);
  });

  it('inserts the surplus when a day has more targets than existing rows', () => {
    const morning = new Date(2026, 6, 1, 9, 0, 0, 0);
    const evening = new Date(2026, 6, 1, 18, 0, 0, 0);
    const morningInstance = makeInstance({ actualStartsAt: morning });

    const plan = diffShiftInstances(
      [morningInstance],
      [makeTarget(morning, 0), makeTarget(evening, 1)],
    );

    expect(plan.toInsert.map((i) => i.actualStartsAt)).toEqual([evening]);
    expect(plan.toRemove).toHaveLength(0);
  });
});
