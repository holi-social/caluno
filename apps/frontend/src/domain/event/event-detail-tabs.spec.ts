import { describe, expect, it } from 'bun:test';
import { EventDetailTab, parseEventDetailTab } from './event-detail-tabs';

describe('parseEventDetailTab', () => {
  it('returns volunteers when the param is volunteers', () => {
    expect(parseEventDetailTab(EventDetailTab.volunteers)).toBe(
      EventDetailTab.volunteers,
    );
  });

  it('defaults to shifts for any other value', () => {
    expect(parseEventDetailTab(EventDetailTab.shifts)).toBe(
      EventDetailTab.shifts,
    );
    expect(parseEventDetailTab(undefined)).toBe(EventDetailTab.shifts);
    expect(parseEventDetailTab('unknown')).toBe(EventDetailTab.shifts);
  });
});
