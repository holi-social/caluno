import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');

  const response = NextResponse.redirect(new URL('/login', request.url));

  if (orgId) {
    response.cookies.set('pending_invite', orgId, {
      httpOnly: true,
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}
