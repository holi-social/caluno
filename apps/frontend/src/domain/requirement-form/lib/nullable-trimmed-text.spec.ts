import { describe, expect, it } from 'bun:test';
import {
  nullableTrimmedText,
  optionalNullableTrimmedText,
} from './nullable-trimmed-text';

describe('nullableTrimmedText', () => {
  it('returns null for empty and whitespace-only strings', () => {
    expect(nullableTrimmedText('')).toBe(null);
    expect(nullableTrimmedText('   ')).toBe(null);
  });

  it('returns trimmed text for non-empty values', () => {
    expect(nullableTrimmedText('  hello  ')).toBe('hello');
  });
});

describe('optionalNullableTrimmedText', () => {
  it('preserves undefined', () => {
    expect(optionalNullableTrimmedText(undefined)).toBe(undefined);
  });

  it('clears empty strings to null', () => {
    expect(optionalNullableTrimmedText('')).toBe(null);
    expect(optionalNullableTrimmedText(' ')).toBe(null);
  });
});
