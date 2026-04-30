import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCurrentUserFromCookieValue, getUserById, USER_COOKIE } from '@/lib/users';

export async function GET() {
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );
  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { userId: string };
  const user = getUserById(body.userId);
  if (!user) {
    return NextResponse.json(
      { error: 'Benutzer nicht gefunden' },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, user.id, {
    path: '/',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json(user);
}
