import { describe, expect, it } from 'bun:test';
import { getStaffingState, staffingBadgeText } from './staffing';

describe('getStaffingState', () => {
  it('is full at or over max', () => {
    expect(getStaffingState(3, 1, 3)).toBe('full');
    expect(getStaffingState(4, 1, 3)).toBe('full');
  });

  it('is alert when empty or below min', () => {
    expect(getStaffingState(0, 1, 3)).toBe('alert');
    expect(getStaffingState(1, 2, 3)).toBe('alert');
    expect(getStaffingState(0, null, null)).toBe('alert');
  });

  it('is neutral otherwise', () => {
    expect(getStaffingState(2, 1, 3)).toBe('neutral');
    expect(getStaffingState(2, null, null)).toBe('neutral');
  });
});

describe('staffingBadgeText', () => {
  it('shows count/min while understaffed with volunteers', () => {
    expect(staffingBadgeText(1, 2, 3, 'alert')).toBe('1/2');
  });
  it('shows count/max when empty without volunteers but a max set', () => {
    expect(staffingBadgeText(0, 2, 3, 'alert')).toBe('0/3');
  });

  it('shows the raw count when empty without max', () => {
    expect(staffingBadgeText(0, 2, null, 'alert')).toBe('0');
  });

  it('shows count/max at and over capacity', () => {
    expect(staffingBadgeText(3, 1, 3, 'full')).toBe('3/3');
    expect(staffingBadgeText(4, 1, 3, 'full')).toBe('4/3');
  });

  it('shows the bare count without max', () => {
    expect(staffingBadgeText(2, null, null, 'neutral')).toBe('2');
  });
});
