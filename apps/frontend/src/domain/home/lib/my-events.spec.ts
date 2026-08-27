import { describe, expect, it } from 'bun:test';
import { addDays, startOfDay } from './date-helpers';
import { countEventsThisWeek, getEventCardLayout } from './my-events';

describe('getEventCardLayout', () => {
  it('fills the row for 0, 1, or 2 events', () => {
    expect(getEventCardLayout(0)).toBe('fill');
    expect(getEventCardLayout(1)).toBe('fill');
    expect(getEventCardLayout(2)).toBe('fill');
  });

  it('uses the fixed-width scroller for 3 or more events', () => {
    expect(getEventCardLayout(3)).toBe('scroller');
    expect(getEventCardLayout(10)).toBe('scroller');
  });
});

describe('countEventsThisWeek', () => {
  const now = new Date('2026-08-19T12:00:00.000Z');
  // The window boundary is app-timezone-aware (Europe/Berlin, see
  // date-helpers.ts), not UTC midnight — derive it the same way production
  // code does instead of hand-computing a UTC-midnight boundary that would
  // silently drift from the real window by the DST offset.
  const windowStart = startOfDay(now);
  const windowEnd = addDays(windowStart, 7);

  const event = (startsAt: string, endsAt: string) => ({ startsAt, endsAt });

  it('counts an event wholly inside the window', () => {
    const events = [
      event('2026-08-20T09:00:00.000Z', '2026-08-20T17:00:00.000Z'),
    ];
    expect(countEventsThisWeek(events, now)).toBe(1);
  });

  it('excludes an event wholly before the window', () => {
    const events = [
      event('2026-08-10T09:00:00.000Z', '2026-08-11T17:00:00.000Z'),
    ];
    expect(countEventsThisWeek(events, now)).toBe(0);
  });

  it('excludes an event wholly after the window', () => {
    const events = [
      event('2026-09-01T09:00:00.000Z', '2026-09-02T17:00:00.000Z'),
    ];
    expect(countEventsThisWeek(events, now)).toBe(0);
  });

  it('includes a multi-day event that starts before but runs into the window', () => {
    const events = [
      event('2026-08-15T09:00:00.000Z', '2026-08-20T17:00:00.000Z'),
    ];
    expect(countEventsThisWeek(events, now)).toBe(1);
  });

  it('includes an event that starts inside the window and ends beyond it', () => {
    const events = [
      event('2026-08-24T09:00:00.000Z', '2026-09-05T17:00:00.000Z'),
    ];
    expect(countEventsThisWeek(events, now)).toBe(1);
  });

  it('excludes an event that ends exactly at the window start (half-open)', () => {
    const events = [
      event(
        new Date(windowStart.getTime() - 2 * 3600_000).toISOString(),
        windowStart.toISOString(),
      ),
    ];
    expect(countEventsThisWeek(events, now)).toBe(0);
  });

  it('excludes an event that starts exactly at the window end (half-open)', () => {
    const events = [
      event(
        windowEnd.toISOString(),
        new Date(windowEnd.getTime() + 3600_000).toISOString(),
      ),
    ];
    expect(countEventsThisWeek(events, now)).toBe(0);
  });

  it('includes an event that starts exactly at the window start', () => {
    const events = [
      event(
        windowStart.toISOString(),
        new Date(windowStart.getTime() + 3600_000).toISOString(),
      ),
    ];
    expect(countEventsThisWeek(events, now)).toBe(1);
  });

  it('counts multiple qualifying events and ignores non-qualifying ones', () => {
    const events = [
      event('2026-08-20T09:00:00.000Z', '2026-08-20T17:00:00.000Z'),
      event('2026-08-10T09:00:00.000Z', '2026-08-11T17:00:00.000Z'),
      event('2026-08-24T09:00:00.000Z', '2026-08-25T17:00:00.000Z'),
    ];
    expect(countEventsThisWeek(events, now)).toBe(2);
  });
});
