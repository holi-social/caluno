import { describe, expect, it } from 'bun:test';
import { choiceOptionSchema, deriveOptionValue } from './option-values';

describe('choiceOptionSchema', () => {
  it('accepts a valid option', () => {
    const result = choiceOptionSchema.safeParse({
      label: '10:30',
      value: '10:30',
    });
    expect(result.success).toBe(true);
  });

  it('trims label and value', () => {
    const result = choiceOptionSchema.safeParse({
      label: '  Morning  ',
      value: ' morning ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ label: 'Morning', value: 'morning' });
    }
  });

  it('rejects an empty value', () => {
    expect(
      choiceOptionSchema.safeParse({ label: '10:30', value: '' }).success,
    ).toBe(false);
  });

  it('rejects a blank value', () => {
    expect(
      choiceOptionSchema.safeParse({ label: '10:30', value: '   ' }).success,
    ).toBe(false);
  });

  it('rejects an empty label', () => {
    expect(
      choiceOptionSchema.safeParse({ label: '', value: 'morning' }).success,
    ).toBe(false);
  });
});

describe('deriveOptionValue', () => {
  it('mirrors the label when the value is empty', () => {
    expect(deriveOptionValue('10:30', '')).toBe('10:30');
  });

  it('mirrors the label when the value is blank', () => {
    expect(deriveOptionValue('10:30', '   ')).toBe('10:30');
  });

  it('keeps an explicitly set value', () => {
    expect(deriveOptionValue('10:30', 'morning')).toBe('morning');
  });
});
