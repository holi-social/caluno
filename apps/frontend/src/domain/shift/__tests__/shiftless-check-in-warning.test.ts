import { describe, expect, it } from 'bun:test';
import { shouldShowShiftlessCheckInWarning } from '../components/manual-check-in/shiftless-check-in-warning';

describe('shouldShowShiftlessCheckInWarning', () => {
  it('shows the warning when checking in without a shift', () => {
    expect(shouldShowShiftlessCheckInWarning(true)).toBe(true);
  });

  it('hides the warning when a shift is selected', () => {
    expect(shouldShowShiftlessCheckInWarning(false)).toBe(false);
  });
});
