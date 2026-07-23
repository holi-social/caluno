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
        actualEndsAt: syncCancelled.actualEndsAt,
        occurrenceIndex: 0,
        restore: true,
      },
    ]);
  });
});
