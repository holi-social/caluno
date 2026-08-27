import { describe, expect, it } from 'bun:test';
import type { EligibleTimeEntry } from '@repo/data';
import {
  contractPeriodForLifespan,
  hoursBetween,
  mapEligibleTimeEntry,
} from './creation-modal.utils';

describe('contractPeriodForLifespan', () => {
  it('covers the full calendar year of the entered MM/YYYY string', () => {
    expect(contractPeriodForLifespan('03/2026')).toEqual({
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2027-01-01T00:00:00.000Z',
    });
  });

  it('falls back to the reference year when the string does not parse', () => {
    expect(
      contractPeriodForLifespan('not-a-date', new Date('2025-06-01T00:00:00Z')),
    ).toEqual({
      periodStart: '2025-01-01T00:00:00.000Z',
      periodEnd: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('hoursBetween', () => {
  it('computes hours between two timestamps', () => {
    expect(hoursBetween('2026-07-05T09:00:00', '2026-07-05T13:00:00')).toBe(4);
  });

  it('rounds to hundredths', () => {
    expect(hoursBetween('2026-07-05T09:00:00', '2026-07-05T09:50:00')).toBe(
      0.83,
    );
  });
});

// No trailing 'Z' — parsed (and later formatted) in local time, so the
// dateTime assertions below don't depend on the test runner's timezone.
function makeEntry(
  overrides: Partial<EligibleTimeEntry> = {},
): EligibleTimeEntry {
  return {
    id: 'te-1',
    startedAt: '2026-07-05T09:00:00',
    endedAt: '2026-07-05T13:00:00',
    notes: null,
    shiftInstance: {
      id: 'si-1',
      master: { title: 'Sonntagsdienst' },
    },
    ...overrides,
  };
}

describe('mapEligibleTimeEntry', () => {
  it('maps a completed entry to shift name, hours and a combined date/time range', () => {
    expect(mapEligibleTimeEntry(makeEntry())).toEqual({
      id: 'te-1',
      shiftName: 'Sonntagsdienst',
      dateTime: '05.07.2026, 09:00–13:00',
      hours: 4,
    });
  });

  it('falls back to notes when there is no shift instance', () => {
    const entry = mapEligibleTimeEntry(
      makeEntry({ shiftInstance: null, notes: 'Ad-hoc Einsatz' }),
    );
    expect(entry.shiftName).toBe('Ad-hoc Einsatz');
  });

  it('treats a still-open entry (no endedAt) as zero hours', () => {
    const entry = mapEligibleTimeEntry(makeEntry({ endedAt: null }));
    expect(entry.hours).toBe(0);
    expect(entry.dateTime).toBe('05.07.2026, 09:00');
  });
});
