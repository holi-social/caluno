import { describe, expect, it } from 'bun:test';
import { buildDateRangeDisabledMatcher } from './date-range-matcher';

describe('buildDateRangeDisabledMatcher', () => {
  it('returns undefined when neither bound is set', () => {
    expect(buildDateRangeDisabledMatcher(undefined, undefined)).toBeUndefined();
  });

  it('returns only a before-matcher when only minDate is set', () => {
    const minDate = new Date('2026-06-01T00:00:00.000Z');
    expect(buildDateRangeDisabledMatcher(minDate, undefined)).toEqual([
      { before: minDate },
    ]);
  });

  it('returns only an after-matcher when only maxDate is set', () => {
    const maxDate = new Date('2026-06-30T00:00:00.000Z');
    expect(buildDateRangeDisabledMatcher(undefined, maxDate)).toEqual([
      { after: maxDate },
    ]);
  });

  it('returns both matchers when both bounds are set', () => {
    const minDate = new Date('2026-06-01T00:00:00.000Z');
    const maxDate = new Date('2026-06-30T00:00:00.000Z');
    expect(buildDateRangeDisabledMatcher(minDate, maxDate)).toEqual([
      { before: minDate },
      { after: maxDate },
    ]);
  });
});
