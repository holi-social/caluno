import { NextResponse } from 'next/server';
import { isSafeRedirect } from '@/lib/safe-redirect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgUId = searchParams.get('orgUId');
  const rawRedirectTo = searchParams.get('redirectTo') ?? undefined;
  const redirectTo = isSafeRedirect(rawRedirectTo) ? rawRedirectTo : undefined;
  const useSignup = searchParams.get('signup') === '1';

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? request.url;
  const authPath = useSignup ? '/signup' : '/login';
  const authUrl = new URL(authPath, baseUrl);
  if (redirectTo) {
    authUrl.searchParams.set('redirectTo', redirectTo);
  }
  const response = NextResponse.redirect(authUrl);

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
