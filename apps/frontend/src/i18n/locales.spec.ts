import { describe, expect, it } from 'bun:test';
import { localeLabel } from './locales';

describe('localeLabel', () => {
  it('returns the display label for a supported locale', () => {
    expect(localeLabel('en')).toBe('English');
    expect(localeLabel('de')).toBe('Deutsch');
  });

  it('passes unknown locale codes through unchanged', () => {
    expect(localeLabel('fr')).toBe('fr');
  });
});
