import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgUId = searchParams.get('orgUId');

  const response = NextResponse.redirect(new URL('/login', request.url));

  if (orgUId) {
    response.cookies.set('pending_invite', orgUId, {
      httpOnly: true,
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}
