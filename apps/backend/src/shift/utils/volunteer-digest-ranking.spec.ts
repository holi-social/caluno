import { describe, expect, it } from 'bun:test';
import {
  computeGap,
  type NeedsVolunteersCandidate,
  rankShiftsNeedingVolunteers,
} from './volunteer-digest-ranking';

function makeCandidate(
  overrides: Partial<NeedsVolunteersCandidate> = {},
): NeedsVolunteersCandidate {
  return {
    instanceId: 'instance-1',
    minVolunteers: 5,
    maxVolunteers: null,
    filledCount: 2,
    daysLeft: 10,
    actualStartsAt: new Date('2026-09-20T10:00:00Z'),
    ...overrides,
  };
}

describe('computeGap', () => {
  it('is minimum minus accepted when a minimum is set', () => {
    expect(
      computeGap({ minVolunteers: 5, maxVolunteers: null, filledCount: 2 }),
    ).toBe(3);
  });

  it('floors at zero when accepted meets or exceeds the minimum', () => {
    expect(
      computeGap({ minVolunteers: 5, maxVolunteers: null, filledCount: 5 }),
    ).toBe(0);
    expect(
      computeGap({ minVolunteers: 5, maxVolunteers: null, filledCount: 8 }),
    ).toBe(0);
  });

  it('falls back to 1 when no minimum is set and nobody has joined', () => {
    expect(
      computeGap({ minVolunteers: null, maxVolunteers: null, filledCount: 0 }),
    ).toBe(1);
  });

  it('falls back to 0.5 when no minimum is set, some joined, and room remains', () => {
    expect(
      computeGap({ minVolunteers: null, maxVolunteers: 10, filledCount: 3 }),
    ).toBe(0.5);
    expect(
      computeGap({ minVolunteers: null, maxVolunteers: null, filledCount: 3 }),
    ).toBe(0.5);
  });

  it('falls back to 0 when no minimum is set and the shift is at capacity', () => {
    expect(
      computeGap({ minVolunteers: null, maxVolunteers: 3, filledCount: 3 }),
    ).toBe(0);
  });
});

describe('rankShiftsNeedingVolunteers', () => {
  it('excludes fully- and over-staffed shifts regardless of days left', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: 5, filledCount: 5 }),
    ]);
    expect(result).toEqual([]);
  });

  it('excludes shifts outside the 2-35 day window', () => {
    const tooSoon = makeCandidate({ instanceId: 'soon', daysLeft: 1.9 });
    const tooFar = makeCandidate({ instanceId: 'far', daysLeft: 35.1 });
    expect(rankShiftsNeedingVolunteers([tooSoon])).toEqual([]);
    expect(rankShiftsNeedingVolunteers([tooFar])).toEqual([]);
  });

  it('includes shifts exactly at the 2 and 35 day boundaries', () => {
    const atLowerBound = makeCandidate({ instanceId: 'lower', daysLeft: 2 });
    const atUpperBound = makeCandidate({ instanceId: 'upper', daysLeft: 35 });
    expect(
      rankShiftsNeedingVolunteers([atLowerBound]).map((r) => r.instanceId),
    ).toEqual(['lower']);
    expect(
      rankShiftsNeedingVolunteers([atUpperBound]).map((r) => r.instanceId),
    ).toEqual(['upper']);
  });

  it('excludes an unrescuable shift: gap > 4 and days_left < 4', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: 10, filledCount: 0, daysLeft: 3 }), // gap 10
    ]);
    expect(result).toEqual([]);
  });

  it('keeps a shift with a large gap once days_left reaches 4', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: 10, filledCount: 0, daysLeft: 4 }),
    ]);
    expect(result).toHaveLength(1);
  });

  it('keeps a shift with days_left < 4 as long as the gap is not too large', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: 5, filledCount: 2, daysLeft: 3 }), // gap 3
    ]);
    expect(result).toHaveLength(1);
  });

  it('orders by gap / days_left descending', () => {
    const urgent = makeCandidate({
      instanceId: 'urgent',
      minVolunteers: 8,
      filledCount: 0,
      daysLeft: 4,
    }); // gap 8 / 4 = 2
    const relaxed = makeCandidate({
      instanceId: 'relaxed',
      minVolunteers: 5,
      filledCount: 3,
      daysLeft: 10,
    }); // gap 2 / 10 = 0.2

    const result = rankShiftsNeedingVolunteers([relaxed, urgent]);
    expect(result.map((r) => r.instanceId)).toEqual(['urgent', 'relaxed']);
  });

  it('does not order by smallest gap first (a near-full shift does not win)', () => {
    const nearlyFull = makeCandidate({
      instanceId: 'nearly-full',
      minVolunteers: 5,
      filledCount: 4,
      daysLeft: 30,
    }); // gap 1 / 30 ≈ 0.033
    const genuinelyAtRisk = makeCandidate({
      instanceId: 'at-risk',
      minVolunteers: 10,
      filledCount: 2,
      daysLeft: 10,
    }); // gap 8 / 10 = 0.8

    const result = rankShiftsNeedingVolunteers([nearlyFull, genuinelyAtRisk]);
    expect(result.map((r) => r.instanceId)).toEqual(['at-risk', 'nearly-full']);
  });

  it('breaks ties by soonest start time, then by instance id', () => {
    const later = makeCandidate({
      instanceId: 'later',
      minVolunteers: 5,
      filledCount: 3,
      daysLeft: 10,
      actualStartsAt: new Date('2026-09-25T10:00:00Z'),
    });
    const sooner = makeCandidate({
      instanceId: 'sooner',
      minVolunteers: 5,
      filledCount: 3,
      daysLeft: 10,
      actualStartsAt: new Date('2026-09-20T10:00:00Z'),
    });

    const result = rankShiftsNeedingVolunteers([later, sooner]);
    expect(result.map((r) => r.instanceId)).toEqual(['sooner', 'later']);
  });

  it('caps the ranked result at 10 rows', () => {
    const candidates = Array.from({ length: 15 }, (_, index) =>
      makeCandidate({
        instanceId: `instance-${index}`,
        minVolunteers: 5,
        filledCount: 0,
        daysLeft: 10 + index, // strictly decreasing urgency so order is deterministic
      }),
    );

    const result = rankShiftsNeedingVolunteers(candidates);
    expect(result).toHaveLength(10);
    expect(result[0]?.instanceId).toBe('instance-0');
  });

  it('reports "no volunteers yet" for the no-minimum, zero-accepted fallback', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: null, filledCount: 0 }),
    ]);
    expect(result[0]?.reason).toEqual({ kind: 'NO_VOLUNTEERS_YET' });
  });

  it('reports "has room" for the no-minimum, some-accepted fallback', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: null, maxVolunteers: 10, filledCount: 3 }),
    ]);
    expect(result[0]?.reason).toEqual({ kind: 'HAS_ROOM' });
  });

  it('reports the exact shortfall count when a minimum is set', () => {
    const result = rankShiftsNeedingVolunteers([
      makeCandidate({ minVolunteers: 5, filledCount: 2 }),
    ]);
    expect(result[0]?.reason).toEqual({
      kind: 'MINIMUM_SHORTFALL',
      needed: 3,
    });
  });
});
