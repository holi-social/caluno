import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ironSessionCookieLooksPlausible } from '@/lib/admin-iron-cookie-guard';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-iron-session-constants';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const raw = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!ironSessionCookieLooksPlausible(raw)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
