import { describe, expect, it } from 'bun:test';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import type { ShiftInstanceData } from './rrule-expander';
import { diffShiftInstances, filterFromDate } from './shift-instance-sync';

function makeInstance(
  overrides: Partial<ShiftInstanceEntity>,
): ShiftInstanceEntity {
  return {
    id: 'id',
    masterId: 'master',
    actualStartsAt: new Date('2026-01-05T09:00:00Z'),
    actualEndsAt: new Date('2026-01-05T13:00:00Z'),
    overrideTitle: null,
    overrideInstructions: null,
    overrideLocation: null,
    overrideMaxVolunteers: null,
    overrideMinVolunteers: null,
    isException: false,
    isCancelled: false,
    cancelledBySync: false,
    occurrenceIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ShiftInstanceEntity;
}

function makeTarget(overrides: Partial<ShiftInstanceData>): ShiftInstanceData {
  return {
    actualStartsAt: new Date('2026-01-05T09:00:00Z'),
    actualEndsAt: new Date('2026-01-05T13:00:00Z'),
    occurrenceIndex: 0,
    ...overrides,
  };
}

describe('filterFromDate', () => {
  it('returns items unchanged when fromDate is not provided', () => {
    const items = [makeInstance({ id: 'a' }), makeInstance({ id: 'b' })];
    expect(filterFromDate(items)).toEqual(items);
  });

  it('drops items strictly before fromDate', () => {
    const past = makeInstance({
      id: 'past',
      actualStartsAt: new Date('2026-01-01T09:00:00Z'),
    });
    const future = makeInstance({
      id: 'future',
      actualStartsAt: new Date('2026-01-10T09:00:00Z'),
    });
    const result = filterFromDate(
      [past, future],
      new Date('2026-01-05T00:00:00Z'),
    );
    expect(result).toEqual([future]);
  });

  it('keeps items exactly at fromDate', () => {
    const boundary = makeInstance({
      id: 'boundary',
      actualStartsAt: new Date('2026-01-05T09:00:00Z'),
    });
    const result = filterFromDate([boundary], boundary.actualStartsAt);
    expect(result).toEqual([boundary]);
  });
});

describe('diffShiftInstances with fromDate-filtered inputs', () => {
  it('never touches a past instance when the time-of-day changed', () => {
    // Filtering by fromDate is what keeps history intact. Day-keyed matching
    // would otherwise MOVE the past instance to the new time — silently
    // rewriting a shift that already happened, underneath its time entries.
    const pastInstance = makeInstance({
      id: 'past',
      actualStartsAt: new Date('2026-01-01T09:00:00Z'), // old time-of-day
    });
    const futureInstanceOldTime = makeInstance({
      id: 'future',
      actualStartsAt: new Date('2026-01-08T09:00:00Z'), // old time-of-day
    });
    const fromDate = new Date('2026-01-08T00:00:00Z');

    const newFutureStart = new Date('2026-01-08T10:00:00Z');
    const fullNewTarget = [
      makeTarget({
        actualStartsAt: new Date('2026-01-01T10:00:00Z'),
        occurrenceIndex: 0,
      }), // new time-of-day, before fromDate
      makeTarget({
        actualStartsAt: newFutureStart,
        occurrenceIndex: 1,
      }), // new time-of-day, at/after fromDate
    ];

    const existing = filterFromDate(
      [pastInstance, futureInstanceOldTime],
      fromDate,
    );
    const target = filterFromDate(fullNewTarget, fromDate);

    const plan = diffShiftInstances(existing, target);

    // The past instance is out of scope entirely — not removed, not moved.
    expect(plan.toRemove).toHaveLength(0);
    expect(plan.toUpdate.map((u) => u.id)).not.toContain('past');

    // The future instance survives its day and moves to the new time.
    expect(plan.toInsert).toHaveLength(0);
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0]?.id).toBe('future');
    expect(plan.toUpdate[0]?.actualStartsAt).toEqual(newFutureStart);
  });
});
