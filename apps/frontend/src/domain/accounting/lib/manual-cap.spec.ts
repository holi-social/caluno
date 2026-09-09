import { describe, expect, it } from 'bun:test';
import {
  initialCapAmountEuros,
  parseEuroInputToCents,
  projectedCapAmount,
} from './manual-cap';

describe('initialCapAmountEuros', () => {
  it('treats a missing baseline as zero', () => {
    expect(initialCapAmountEuros(null)).toBe(0);
    expect(initialCapAmountEuros(undefined)).toBe(0);
  });

  it('converts the baseline cents to euros', () => {
    expect(initialCapAmountEuros(50000)).toBe(500);
    expect(initialCapAmountEuros(0)).toBe(0);
  });
});

describe('parseEuroInputToCents', () => {
  it('parses a whole-euro input', () => {
    expect(parseEuroInputToCents('500')).toBe(50000);
  });

  it('accepts comma and dot decimals', () => {
    expect(parseEuroInputToCents('4,5')).toBe(450);
    expect(parseEuroInputToCents('4.5')).toBe(450);
  });

  it('rejects empty and non-numeric input', () => {
    expect(parseEuroInputToCents('')).toBeNull();
    expect(parseEuroInputToCents('abc')).toBeNull();
  });

  it('rejects negative amounts', () => {
    expect(parseEuroInputToCents('-10')).toBeNull();
  });
});

describe('projectedCapAmount', () => {
  it('adds the used-before amount to the selected amount', () => {
    expect(projectedCapAmount(500, 250)).toBe(750);
  });
});
