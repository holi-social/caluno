import { describe, expect, it } from 'bun:test';
import { parseDiscoverTab } from './discover-tabs';

describe('parseDiscoverTab', () => {
  it('returns "events" for the "events" param', () => {
    expect(parseDiscoverTab('events')).toBe('events');
  });

  it('falls back to "assignments" for null', () => {
    expect(parseDiscoverTab(null)).toBe('assignments');
  });

  it('falls back to "assignments" for undefined', () => {
    expect(parseDiscoverTab(undefined)).toBe('assignments');
  });

  it('falls back to "assignments" for an empty string', () => {
    expect(parseDiscoverTab('')).toBe('assignments');
  });

  it('falls back to "assignments" for an unrecognized value', () => {
    expect(parseDiscoverTab('assignments')).toBe('assignments');
    expect(parseDiscoverTab('bogus')).toBe('assignments');
  });
});
