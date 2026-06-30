import {
  DEFAULT_LOCALE,
  type Locale,
  parseAcceptLanguageHeader,
  resolveRequestLocale,
} from './locale';

describe('resolveRequestLocale', () => {
  it.each([
    ['de', 'de'],
    ['en', 'en'],
    ['de-DE', 'de'],
    ['EN-us', 'en'],
  ] satisfies Array<
    [string, Locale]
  >)('uses supported x-locale value %s', (header, expected) => {
    expect(resolveRequestLocale({ 'x-locale': header })).toBe(expected);
  });

  it.each([
    ['de', 'de'],
    ['en-US,en;q=0.9,de;q=0.8', 'en'],
    ['de-DE,de;q=0.9,en-US;q=0.7', 'de'],
    ['fr,de;q=0.9', 'de'],
  ] satisfies Array<
    [string, Locale]
  >)('uses Accept-Language %s', (header, expected) => {
    expect(resolveRequestLocale({ 'accept-language': header })).toBe(expected);
  });

  it('prefers x-locale over Accept-Language', () => {
    expect(
      resolveRequestLocale({
        'x-locale': 'en',
        'accept-language': 'de',
      }),
    ).toBe('en');
  });

  it('falls back to the default locale when no supported locale is present', () => {
    expect(resolveRequestLocale({ 'x-locale': 'fr' })).toBe(DEFAULT_LOCALE);
  });
});

describe('parseAcceptLanguageHeader', () => {
  it('returns undefined for non-string values', () => {
    expect(parseAcceptLanguageHeader(undefined)).toBeUndefined();
    expect(parseAcceptLanguageHeader(null)).toBeUndefined();
  });

  it('uses the first item when the header is an array', () => {
    expect(parseAcceptLanguageHeader(['de'])).toBe('de');
  });

  it('returns the first supported locale', () => {
    expect(parseAcceptLanguageHeader('de')).toBe('de');
    expect(parseAcceptLanguageHeader('de-DE,de;q=0.9,en;q=0.7')).toBe('de');
  });

  it('skips unsupported locales', () => {
    expect(parseAcceptLanguageHeader('fr,de;q=0.9')).toBe('de');
    expect(parseAcceptLanguageHeader('fr,nl;q=0.9')).toBeUndefined();
  });
});
