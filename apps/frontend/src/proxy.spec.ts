import { describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { USER_LOCALE_COOKIE } from '@/lib/locale-constants';
import { localePreferenceRedirect } from './proxy';

function makeRequest(pathname: string, cookieLocale?: string): NextRequest {
  const url = new URL(`http://localhost:3000${pathname}`);
  return new NextRequest(url, {
    headers: cookieLocale
      ? { cookie: `${USER_LOCALE_COOKIE}=${cookieLocale}` }
      : undefined,
  });
}

describe('localePreferenceRedirect', () => {
  it('returns null when no locale cookie is set', () => {
    expect(localePreferenceRedirect(makeRequest('/en/dashboard'))).toBeNull();
  });

  it('returns null when the cookie locale matches the URL locale', () => {
    expect(
      localePreferenceRedirect(makeRequest('/de/dashboard', 'de')),
    ).toBeNull();
  });

  it('returns null for unsupported cookie locales', () => {
    expect(
      localePreferenceRedirect(makeRequest('/en/dashboard', 'fr')),
    ).toBeNull();
  });

  it('redirects to the cookie locale stripping the existing prefix', () => {
    const response = localePreferenceRedirect(
      makeRequest('/en/dashboard', 'de'),
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe(
      'http://localhost:3000/de/dashboard',
    );
  });

  it('redirects the root locale path without duplicating the prefix', () => {
    const response = localePreferenceRedirect(makeRequest('/en', 'de'));

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/de');
  });

  it('redirects a bare root path to the cookie locale', () => {
    const response = localePreferenceRedirect(makeRequest('/', 'de'));

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/de');
  });

  it('redirects a path without a locale prefix to the cookie locale', () => {
    const response = localePreferenceRedirect(makeRequest('/dashboard', 'de'));

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe(
      'http://localhost:3000/de/dashboard',
    );
  });

  it('returns null for a bare path when the cookie matches the default locale', () => {
    // `/dashboard` resolves to the default locale (`en`); intl adds the prefix.
    expect(
      localePreferenceRedirect(makeRequest('/dashboard', 'en')),
    ).toBeNull();
  });

  it('normalises a duplicate locale prefix instead of stacking it', () => {
    const response = localePreferenceRedirect(
      makeRequest('/en/en/dashboard', 'de'),
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe(
      'http://localhost:3000/de/dashboard',
    );
  });

  it('normalises deeply stacked locale prefixes', () => {
    const response = localePreferenceRedirect(
      makeRequest('/en/en/en/dashboard', 'de'),
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe(
      'http://localhost:3000/de/dashboard',
    );
  });
});
