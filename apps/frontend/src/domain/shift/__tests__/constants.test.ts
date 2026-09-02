import { describe, expect, it } from 'bun:test';
import { getPresetFromDays } from '../constants';

describe('getPresetFromDays', () => {
  it('returns none for an empty day list', () => {
    expect(getPresetFromDays([])).toBe('none');
  });

  it('returns daily for all seven days', () => {
    expect(
      getPresetFromDays([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]),
    ).toBe('daily');
  });

  it('returns working-days for Mon-Fri regardless of order', () => {
    expect(
      getPresetFromDays([
        'FRIDAY',
        'MONDAY',
        'WEDNESDAY',
        'TUESDAY',
        'THURSDAY',
      ]),
    ).toBe('working-days');
  });

  it('returns weekend for Sat+Sun', () => {
    expect(getPresetFromDays(['SATURDAY', 'SUNDAY'])).toBe('weekend');
  });

  it('returns custom for any other combination', () => {
    expect(getPresetFromDays(['MONDAY', 'FRIDAY'])).toBe('custom');
  });
});
