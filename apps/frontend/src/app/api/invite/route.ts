import { NextResponse } from 'next/server';
import { isSafeRedirect } from '@/lib/safe-redirect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgUId = searchParams.get('orgUId');
  const rawRedirectTo = searchParams.get('redirectTo') ?? undefined;
  const redirectTo = isSafeRedirect(rawRedirectTo) ? rawRedirectTo : undefined;

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? request.url;
  const response = NextResponse.redirect(new URL('/signup', baseUrl));

  if (orgUId) {
    response.cookies.set('pending_invite', orgUId, {
      httpOnly: true,
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
    });
  }

  if (redirectTo) {
    response.cookies.set('pending_redirect', redirectTo, {
      httpOnly: true,
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}
