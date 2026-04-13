import { NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/admin-credentials';
import { getAdminSession, isAdminSessionConfigured } from '@/lib/admin-iron-session';

export async function POST(request: Request) {
  if (!isAdminSessionConfigured()) {
    return NextResponse.json(
      { error: 'Server misconfigured: ADMIN_SESSION_SECRET must be at least 32 characters' },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    const username = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await getAdminSession();
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
