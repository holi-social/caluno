import { describe, expect, it } from 'bun:test';
import { getInitials } from './get-initials';

describe('getInitials', () => {
  it('returns ? for a missing name', () => {
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('takes the first letter of the first two words', () => {
    expect(getInitials('Alexandra Bauer')).toBe('AB');
    expect(getInitials('John Ronald Tolkien')).toBe('JR');
  });

  it('returns a single initial for a single word', () => {
    expect(getInitials('Alexandra')).toBe('A');
  });

  it('uppercases lowercase input', () => {
    expect(getInitials('a b')).toBe('AB');
  });

  it('ignores leading, trailing, and duplicate spaces', () => {
    expect(getInitials('  Alexandra   Bauer ')).toBe('AB');
  });
});
