import { LAST_ORG_COOKIE } from '@repo/data';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Public routes that DON'T need org slug injection.
 * Everything else is assumed to be a dashboard route that needs org context.
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/create-organization',
  '/unauthorized',
];

/**
 * Proxy to automatically inject org slug for dashboard routes.
 *
 * Strategy: Routes under (dashboard)/[orgSlug] need the org prefix.
 * - Public routes (login, signup, etc.) → pass through
 * - Routes that already have org slug (/{slug}/...) → pass through
 * - Everything else → inject org slug from cookie
 *
 * This allows code to use simple paths like router.push('/shifts')
 * without manually handling the org slug.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Skip if route already has org slug (format: /{slug}/something)
  // Check for pattern: starts with / then slug then / then something
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    return NextResponse.next();
  }

  // This is a simple path like /shifts, /volunteers, etc.
  // Try to get org slug from multiple sources (fallback chain)

  // 1. Try cookie first (most reliable)
  let orgSlug = request.cookies.get(LAST_ORG_COOKIE)?.value;

  // 2. If no cookie, try to extract from referrer URL
  if (!orgSlug) {
    const referrer = request.headers.get('referer');
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerParts = referrerUrl.pathname.split('/').filter(Boolean);
        // If referrer is like /{orgSlug}/something, extract the org
        if (
          referrerParts.length >= 2 &&
          !PUBLIC_ROUTES.includes(`/${referrerParts[0]}`)
        ) {
          orgSlug = referrerParts[0];
        }
      } catch {
        // Invalid referrer URL, ignore
      }
    }
  }

  if (orgSlug) {
    // Rewrite to /{orgSlug}{pathname}
    const url = request.nextUrl.clone();
    url.pathname = `/${orgSlug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // No org slug found anywhere - redirect to home page to initialize
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    // Exclude Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).+)',
  ],
};
