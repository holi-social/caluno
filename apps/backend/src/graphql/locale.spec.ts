import { DEFAULT_LOCALE, type Locale, resolveRequestLocale } from './locale';

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

  it('ignores Accept-Language when x-locale is unsupported', () => {
    expect(
      resolveRequestLocale({
        'x-locale': 'fr',
        'accept-language': 'de',
      }),
    ).toBe(DEFAULT_LOCALE);
  });

  it('falls back to the default locale when no supported locale is present', () => {
    expect(resolveRequestLocale({ 'x-locale': 'fr' })).toBe(DEFAULT_LOCALE);
  });
});
