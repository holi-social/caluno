import { describe, expect, it } from 'bun:test';
import { centsToEuros, eurosToCents, formatHourlyRate } from './money';

describe('centsToEuros', () => {
  it('converts integer cents to euros', () => {
    expect(centsToEuros(450)).toBe(4.5);
    expect(centsToEuros(84000)).toBe(840);
    expect(centsToEuros(0)).toBe(0);
  });
});

describe('eurosToCents', () => {
  it('converts euros to integer cents', () => {
    expect(eurosToCents(4.5)).toBe(450);
    expect(eurosToCents(840)).toBe(84000);
  });

  it('rounds to the nearest cent', () => {
    expect(eurosToCents(4.505)).toBe(451);
    // Floating-point trap: 4.45 * 100 = 444.99999999999994
    expect(eurosToCents(4.45)).toBe(445);
  });
});

describe('formatHourlyRate', () => {
  it('keeps two fraction digits for non-integer rates', () => {
    expect(formatHourlyRate(4.5)).toBe('4,50 €');
  });

  it('pads integer rates with cents', () => {
    expect(formatHourlyRate(8)).toBe('8,00 €');
  });
});
