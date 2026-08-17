import type { Locale } from '@repo/data';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { USER_LOCALE_COOKIE } from '@/lib/locale-constants';
import { hasSessionCookie } from '@/lib/session-cookie';

type Middleware = (request: NextRequest) => NextResponse;

const intlMiddleware = createMiddleware(routing);

const supportedLocales = new Set<Locale>(routing.locales);

function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.has(value as Locale);
}

/**
 * Pure locale-preference decision. Returns a 307 redirect to the
 * `caluno.locale` preference when it is supported and differs from the URL
 * locale, otherwise `null` (let the next middleware handle the request).
 *
 * Kept free of next-intl so it can be unit-tested in isolation.
 */
export function localePreferenceRedirect(
  request: NextRequest,
): NextResponse | null {
  // Only authenticated users have an explicit stored preference. Logged-out
  // visitors fall through to next-intl (URL-authoritative + Accept-Language
  // detection) so they can still switch locale via the URL.
  if (!hasSessionCookie(request)) {
    return null;
  }

  const cookieLocale = request.cookies.get(USER_LOCALE_COOKIE)?.value;

  if (!cookieLocale || !isSupportedLocale(cookieLocale)) {
    return null;
  }

  const currentLocale =
    getLocaleFromPathname(request.nextUrl.pathname) ?? routing.defaultLocale;

  if (currentLocale === cookieLocale) {
    return null;
  }

  return redirectToLocale(request, cookieLocale);
}

/**
 * Compose a locale-preference redirect in front of another middleware. The
 * preference wins; anything it does not handle falls through to `next`.
 */
export function withLocalePreference(next: Middleware): Middleware {
  return (request) => localePreferenceRedirect(request) ?? next(request);
}

// The intl fallback is load-bearing: it prefixes bare paths (localePrefix
// 'always') and runs Accept-Language detection for visitors without a
// preference cookie.
export const proxy = withLocalePreference(intlMiddleware);

function redirectToLocale(request: NextRequest, cookieLocale: Locale) {
  const pathWithoutLocale = stripLocalePrefix(request.nextUrl.pathname);
  const targetPathname =
    pathWithoutLocale === '/'
      ? `/${cookieLocale}`
      : `/${cookieLocale}${pathWithoutLocale}`;

  return NextResponse.redirect(new URL(targetPathname, request.url), 307);
}

function getLocaleFromPathname(pathname: string): Locale | undefined {
  const firstSegment = pathname.split('/')[1];
  return firstSegment && isSupportedLocale(firstSegment)
    ? firstSegment
    : undefined;
}

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  let startIndex = 0;

  while (
    startIndex < segments.length &&
    isSupportedLocale(segments[startIndex] as string)
  ) {
    startIndex++;
  }

  const remaining = segments.slice(startIndex).join('/');
  return remaining ? `/${remaining}` : '/';
}

export const config = {
  // The `sentry-tunnel` exclusion is prefix-based: no app route may ever use
  // the `sentry-tunnel` prefix, or it would silently bypass this middleware.
  matcher: ['/((?!api|_next|_vercel|sentry-tunnel|.*\\..*).*)'],
};
