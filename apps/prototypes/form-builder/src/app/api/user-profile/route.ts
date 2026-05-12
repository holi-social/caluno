import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { USER_COOKIE } from '@/lib/users';
import {
  getUserProfile,
  upsertProfileEntries,
  type ProfileEntryValue,
} from '@/lib/store-user-profiles';
import {
  SYSTEM_REQUIREMENTS,
  type SystemRequirementKey,
} from '@/lib/system-requirements';

/**
 * Prototype: the "volunteer" identity is the same USER_COOKIE used by the
 * builder. Production swap: replace this helper with the real auth lookup.
 */
async function getVolunteerId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_COOKIE)?.value ?? null;
}

export async function GET() {
  const userId = await getVolunteerId();
  if (!userId) {
    return NextResponse.json({ userId: null, entries: {} });
  }
  const profile = await getUserProfile(userId);
  return NextResponse.json(profile ?? { userId, entries: {} });
}

type PostBody = {
  entries: { key: string; value: ProfileEntryValue; subOrg: string }[];
};

export async function POST(request: Request) {
  const userId = await getVolunteerId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Nicht angemeldet' },
      { status: 401 },
    );
  }

  const body = (await request.json()) as PostBody;
  if (!Array.isArray(body.entries)) {
    return NextResponse.json(
      { error: 'Ungueltiger Request-Body' },
      { status: 400 },
    );
  }

  // Filter to known system requirement keys; ignore anything unknown.
  const sanitized = body.entries
    .filter((e) => e.key in SYSTEM_REQUIREMENTS)
    .map((e) => ({
      key: e.key as SystemRequirementKey,
      value: e.value,
      subOrg: e.subOrg,
    }));

  if (sanitized.length === 0) {
    const existing = await getUserProfile(userId);
    return NextResponse.json(existing ?? { userId, entries: {} });
  }

  const updated = await upsertProfileEntries(userId, sanitized);
  return NextResponse.json(updated);
}
