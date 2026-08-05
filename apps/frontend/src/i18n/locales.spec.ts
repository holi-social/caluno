import { describe, expect, it } from 'bun:test';
import { LOCALES, localeLabel } from './locales';

describe('LOCALES', () => {
  it('covers the supported app locales in order', () => {
    expect(LOCALES.map((entry) => entry.key)).toEqual(['en', 'de']);
  });
});

describe('localeLabel', () => {
  it('returns the display label for a supported locale', () => {
    expect(localeLabel('en')).toBe('English');
    expect(localeLabel('de')).toBe('Deutsch');
  });

  it('passes unknown locale codes through unchanged', () => {
    expect(localeLabel('fr')).toBe('fr');
  });
});
