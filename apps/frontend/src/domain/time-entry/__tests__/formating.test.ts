import { describe, expect, it } from 'bun:test';

import { formatTotalMinutes } from '../formating';

describe('formatTotalMinutes', () => {
  it('formats hours and minutes', () => {
    expect(formatTotalMinutes(270)).toBe('4h 30m');
    expect(formatTotalMinutes(120)).toBe('2h 0m');
    expect(formatTotalMinutes(0)).toBe('0h 0m');
  });
});
