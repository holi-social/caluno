import { NextResponse } from 'next/server';
import { getAdminSession, isAdminSessionConfigured } from '@/lib/admin-iron-session';

export async function POST() {
  try {
    if (isAdminSessionConfigured()) {
      const session = await getAdminSession();
      session.destroy();
    }
  } catch {
    // no-op: session missing or invalid
  }
  return NextResponse.json({ ok: true });
}
