import { describe, expect, it } from 'bun:test';
import { orgHasShifts } from '../weekplan';

describe('orgHasShifts', () => {
  it('is false when the org has zero shifts', () => {
    expect(orgHasShifts(0)).toBe(false);
  });

  it('is true when the org has at least one shift', () => {
    expect(orgHasShifts(1)).toBe(true);
    expect(orgHasShifts(12)).toBe(true);
  });
});
