import { describe, expect, it } from 'bun:test';
import {
  formatShiftOrgUnitLabel,
  resolveShiftCreatedRecurrenceBadge,
} from '../success-dialog';

describe('resolveShiftCreatedRecurrenceBadge', () => {
  it('returns the oneTime preset for an empty day list', () => {
    expect(resolveShiftCreatedRecurrenceBadge([])).toEqual({
      kind: 'preset',
      translationKey: 'oneTime',
    });
  });

  it('returns the daily preset for all seven days', () => {
    expect(
      resolveShiftCreatedRecurrenceBadge([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]),
    ).toEqual({ kind: 'preset', translationKey: 'daily' });
  });

  it('returns the workingDays preset for Mon-Fri', () => {
    expect(
      resolveShiftCreatedRecurrenceBadge([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
      ]),
    ).toEqual({ kind: 'preset', translationKey: 'workingDays' });
  });

  it('returns the weekend preset for Sat+Sun', () => {
    expect(resolveShiftCreatedRecurrenceBadge(['SATURDAY', 'SUNDAY'])).toEqual({
      kind: 'preset',
      translationKey: 'weekend',
    });
  });

  it('returns custom days sorted into calendar order regardless of input order', () => {
    expect(
      resolveShiftCreatedRecurrenceBadge(['FRIDAY', 'MONDAY', 'WEDNESDAY']),
    ).toEqual({
      kind: 'custom',
      days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    });
  });
});

describe('formatShiftOrgUnitLabel', () => {
  it('joins organization and unit name with a middle dot when they differ', () => {
    expect(
      formatShiftOrgUnitLabel({
        name: 'Health',
        organization: { name: 'Caluno' },
      }),
    ).toBe('Caluno · Health');
  });

  it('collapses to a single name when the unit is the organization root unit', () => {
    expect(
      formatShiftOrgUnitLabel({
        name: 'Caluno',
        organization: { name: 'Caluno' },
      }),
    ).toBe('Caluno');
  });
});
