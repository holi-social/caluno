import { NextResponse } from 'next/server';
import { getAdminSession, isAdminSessionConfigured } from '@/lib/admin-iron-session';
import { listEntries } from '@/lib/store';

export async function GET() {
  if (!isAdminSessionConfigured()) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }

  const session = await getAdminSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = await listEntries();
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 });
  }
}
