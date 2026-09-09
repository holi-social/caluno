import { describe, expect, it } from 'bun:test';
import { classifyTimeRange, resolveTimeRangeOnDate } from './time-range';

describe('resolveTimeRangeOnDate', () => {
  const date = new Date(2026, 8, 11, 0, 0, 0, 0); // 11 Sep 2026, local

  it('keeps same-day times on the same calendar date', () => {
    const { start, end } = resolveTimeRangeOnDate(date, '08:00', '12:00', {
      allowOvernight: true,
    });
    expect(start.getHours()).toBe(8);
    expect(end.getHours()).toBe(12);
    expect(end.getDate()).toBe(start.getDate());
    expect(end.getTime() - start.getTime()).toBe(4 * 60 * 60 * 1000);
  });

  it('rolls end onto the next day when the end clock is earlier than start', () => {
    const { start, end } = resolveTimeRangeOnDate(date, '20:00', '01:00', {
      allowOvernight: true,
    });
    expect(start.getHours()).toBe(20);
    expect(end.getHours()).toBe(1);
    expect(end.getDate()).toBe(start.getDate() + 1);
    expect(end.getTime() - start.getTime()).toBe(5 * 60 * 60 * 1000);
  });

  it('does not wrap equal clocks into a 24-hour shift', () => {
    const { start, end } = resolveTimeRangeOnDate(date, '20:00', '20:00', {
      allowOvernight: true,
    });
    expect(end.getTime()).toBe(start.getTime());
    expect(end.getDate()).toBe(start.getDate());
  });

  it('does not wrap overnight when allowOvernight is false', () => {
    const { start, end } = resolveTimeRangeOnDate(date, '20:00', '01:00');
    expect(end.getDate()).toBe(start.getDate());
    expect(end.getTime()).toBeLessThan(start.getTime());
  });

  it('lands the end clock on the next calendar date, not +24 elapsed hours', () => {
    // 2026-03-28 → 29 is a Berlin spring-forward. +24h from 04:00 lands on
    // 05:00 CEST; next-calendar-day 04:00 is the spec.
    const springForwardEve = new Date(2026, 2, 28, 0, 0, 0, 0);
    const { end } = resolveTimeRangeOnDate(springForwardEve, '23:00', '04:00', {
      allowOvernight: true,
    });
    const nextCalendarEnd = new Date(2026, 2, 29, 4, 0, 0, 0);
    expect(end.getTime()).toBe(nextCalendarEnd.getTime());
    expect(end.getHours()).toBe(4);
  });
});

describe('classifyTimeRange', () => {
  it('marks a same-day span as ok', () => {
    expect(
      classifyTimeRange(
        new Date(2026, 8, 11, 8, 0),
        new Date(2026, 8, 11, 12, 0),
      ),
    ).toBe('ok');
  });

  it('marks a next-day end as overnight', () => {
    expect(
      classifyTimeRange(
        new Date(2026, 8, 11, 20, 0),
        new Date(2026, 8, 12, 1, 0),
      ),
    ).toBe('overnight');
  });

  it('marks equal times as endNotAfterStart', () => {
    const at = new Date(2026, 8, 11, 20, 0);
    expect(classifyTimeRange(at, new Date(at.getTime()))).toBe(
      'endNotAfterStart',
    );
  });

  it('marks a 24-hour span as tooLong', () => {
    expect(
      classifyTimeRange(
        new Date(2026, 8, 11, 20, 0),
        new Date(2026, 8, 12, 20, 0),
      ),
    ).toBe('tooLong');
  });
});
