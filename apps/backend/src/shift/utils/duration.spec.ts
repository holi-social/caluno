import {
  getDurationMinutes,
  isValidShiftDurationMinutes,
  MAX_SHIFT_DURATION_MINUTES,
  MIN_SHIFT_DURATION_MINUTES,
} from './duration';

describe('getDurationMinutes', () => {
  it('returns elapsed minutes across midnight', () => {
    const start = new Date('2026-09-11T20:00:00.000Z');
    const end = new Date('2026-09-12T01:00:00.000Z');
    expect(getDurationMinutes(start, end)).toBe(300);
  });

  it('uses elapsed time, not clock hours, across a DST spring-forward', () => {
    // Berlin 2026-03-29 02:00 → 03:00. 23:00 CET to 04:00 CEST is 4h elapsed.
    const start = new Date('2026-03-28T22:00:00.000Z');
    const end = new Date('2026-03-29T02:00:00.000Z');
    expect(getDurationMinutes(start, end)).toBe(240);
  });
});

describe('isValidShiftDurationMinutes', () => {
  it('accepts 1 minute and 23h59', () => {
    expect(isValidShiftDurationMinutes(MIN_SHIFT_DURATION_MINUTES)).toBe(true);
    expect(isValidShiftDurationMinutes(MAX_SHIFT_DURATION_MINUTES)).toBe(true);
  });

  it('rejects 0 and 24 hours', () => {
    expect(isValidShiftDurationMinutes(0)).toBe(false);
    expect(isValidShiftDurationMinutes(24 * 60)).toBe(false);
  });
});
