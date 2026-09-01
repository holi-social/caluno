import { describe, expect, it } from 'bun:test';
import {
  applyDate,
  applyOrgUnit,
  applyShift,
  applyShiftInstance,
  type CheckInInstance,
  type CheckInSelection,
  pickInitialInstance,
  toCheckInInstance,
} from '../check-in-selection';

// Fixtures are built in LOCAL time on purpose: `instancesOnDate` compares
// local calendar days, so midnight-UTC literals would land on the previous
// or next day depending on the runner's timezone.
const sep = (day: number, hour: number, minute = 0) =>
  new Date(2026, 8, day, hour, minute);

const instance = (
  id: string,
  masterId: string,
  start: Date,
  end: Date,
): CheckInInstance => ({
  id,
  masterId,
  title: `Shift ${masterId}`,
  actualStartsAt: start.toISOString(),
  actualEndsAt: end.toISOString(),
});

const NOW = sep(1, 12);

// Two shifts today, one tomorrow.
const soupToday = instance('i-soup-today', 'soup', sep(1, 18), sep(1, 19));
const gardenToday = instance(
  'i-garden-today',
  'garden',
  sep(1, 11, 30),
  sep(1, 13),
);
const soupTomorrow = instance(
  'i-soup-tomorrow',
  'soup',
  sep(2, 18),
  sep(2, 19),
);
const ALL = [soupToday, gardenToday, soupTomorrow];

const base: CheckInSelection = {
  orgUnitId: 'ou-1',
  date: sep(1, 0),
  shiftId: 'soup',
  shiftInstanceId: 'i-soup-today',
};

describe('pickInitialInstance', () => {
  it('prefers an instance that is currently running', () => {
    expect(pickInitialInstance(ALL, NOW)).toEqual({
      shiftId: 'garden',
      shiftInstanceId: 'i-garden-today',
    });
  });

  it('falls back to the instance starting closest to now', () => {
    const early = sep(1, 8);
    expect(pickInitialInstance([soupToday, gardenToday], early)).toEqual({
      shiftId: 'garden',
      shiftInstanceId: 'i-garden-today',
    });
  });

  it('returns null when nothing runs today', () => {
    expect(pickInitialInstance([soupTomorrow], NOW)).toBeNull();
  });
});

describe('applyDate', () => {
  it('repoints the instance when the shift also runs on the new date', () => {
    const next = applyDate(base, sep(2, 0), ALL, NOW);
    expect(next.shiftId).toBe('soup');
    expect(next.shiftInstanceId).toBe('i-soup-tomorrow');
  });

  it('clears the shift when it has no instance on the new date', () => {
    const next = applyDate(base, sep(3, 0), ALL, NOW);
    expect(next.date).toEqual(sep(3, 0));
    expect(next.shiftId).toBeNull();
    expect(next.shiftInstanceId).toBeNull();
  });

  it('keeps the shift cleared when none is selected', () => {
    const noShift = { ...base, shiftId: null, shiftInstanceId: null };
    const next = applyDate(noShift, sep(2, 0), ALL, NOW);
    expect(next.date).toEqual(sep(2, 0));
    expect(next.shiftId).toBeNull();
    expect(next.shiftInstanceId).toBeNull();
  });
});

describe('applyShift', () => {
  it('selects the shift and its instance on the current date', () => {
    const next = applyShift(base, 'garden', ALL, NOW);
    expect(next.shiftId).toBe('garden');
    expect(next.shiftInstanceId).toBe('i-garden-today');
    expect(next.date).toEqual(base.date);
  });

  it('clears the date when the shift has no instance on it', () => {
    const noShiftSelected = { ...base, shiftId: null, shiftInstanceId: null };
    const next = applyShift(noShiftSelected, 'nope', ALL, NOW);
    expect(next.shiftId).toBe('nope');
    expect(next.date).toBeNull();
    expect(next.shiftInstanceId).toBeNull();
  });

  it('picks the instance closest to now when a shift runs twice that day', () => {
    const soupEarly = instance(
      'i-soup-early',
      'soup',
      sep(1, 11),
      sep(1, 11, 30),
    );
    const next = applyShift(base, 'soup', [soupEarly, soupToday], NOW);
    expect(next.shiftInstanceId).toBe('i-soup-early');
  });
});

describe('applyOrgUnit', () => {
  it('clears the shift but keeps the date', () => {
    const next = applyOrgUnit(base, 'ou-2');
    expect(next.orgUnitId).toBe('ou-2');
    expect(next.date).toEqual(base.date);
    expect(next.shiftId).toBeNull();
    expect(next.shiftInstanceId).toBeNull();
  });
});

describe('toCheckInInstance', () => {
  const raw = {
    id: 'i-1',
    actualStartsAt: soupToday.actualStartsAt,
    actualEndsAt: soupToday.actualEndsAt,
    master: { id: 'soup', title: 'Soup kitchen' },
  };

  it('prefers the instance override title', () => {
    expect(
      toCheckInInstance({ ...raw, overrideTitle: 'Renamed for tonight' }).title,
    ).toBe('Renamed for tonight');
  });

  it('falls back to the shift title when there is no override', () => {
    expect(toCheckInInstance({ ...raw, overrideTitle: null })).toEqual({
      id: 'i-1',
      masterId: 'soup',
      title: 'Soup kitchen',
      actualStartsAt: soupToday.actualStartsAt,
      actualEndsAt: soupToday.actualEndsAt,
    });
  });
});

describe('applyShiftInstance', () => {
  it('sets shift, instance and date together from one instance', () => {
    const cleared: CheckInSelection = {
      orgUnitId: 'ou-1',
      date: null,
      shiftId: 'soup',
      shiftInstanceId: null,
    };
    const next = applyShiftInstance(cleared, soupTomorrow);
    expect(next.shiftId).toBe('soup');
    expect(next.shiftInstanceId).toBe('i-soup-tomorrow');
    expect(next.date?.toDateString()).toBe(sep(2, 0).toDateString());
  });

  it('repoints every field when switching to a different shift', () => {
    const next = applyShiftInstance(base, gardenToday);
    expect(next.shiftId).toBe('garden');
    expect(next.shiftInstanceId).toBe('i-garden-today');
    expect(next.date?.toDateString()).toBe(sep(1, 0).toDateString());
  });
});
