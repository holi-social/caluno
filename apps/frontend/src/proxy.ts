import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { USER_LOCALE_COOKIE } from '@/lib/locale-constants';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const userLocale = request.cookies.get(USER_LOCALE_COOKIE)?.value;
  const urlLocale = request.nextUrl.locale;

  if (
    userLocale &&
    routing.locales.includes(userLocale as (typeof routing.locales)[number]) &&
    userLocale !== urlLocale
  ) {
    const newUrl = new URL(request.nextUrl.pathname, request.nextUrl);
    newUrl.pathname = `/${userLocale}${request.nextUrl.pathname}`;
    return Response.redirect(newUrl, 307);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
