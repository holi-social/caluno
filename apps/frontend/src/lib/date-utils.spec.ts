import { describe, expect, it } from 'bun:test';
import { parseWeekStart } from './date-utils';

describe('parseWeekStart', () => {
  it('returns Monday of the week that contains the given date', () => {
    const result = parseWeekStart('2026-08-19');
    expect(result.getDay()).toBe(1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(17);
  });

  it('uses the fallback when the param is missing', () => {
    const fallback = new Date('2026-08-19T12:00:00');
    const result = parseWeekStart(undefined, fallback);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(17);
  });

  it('uses the fallback when the param is not a valid date', () => {
    const fallback = new Date('2026-08-19T12:00:00');
    const result = parseWeekStart('not-a-date', fallback);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(17);
  });
});
