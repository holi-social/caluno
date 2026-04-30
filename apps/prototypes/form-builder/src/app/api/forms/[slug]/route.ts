import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  deleteFormConfig,
  getFormConfig,
  updateFormConfig,
} from '@/lib/store-configs';
import {
  getCurrentUserFromCookieValue,
  canEditForm,
  canDeleteForm,
  USER_COOKIE,
} from '@/lib/users';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const config = await getFormConfig(slug);
  if (!config) {
    return NextResponse.json(
      { error: 'Formular nicht gefunden' },
      { status: 404 },
    );
  }
  return NextResponse.json(config);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const existing = await getFormConfig(slug);
  if (!existing) {
    return NextResponse.json(
      { error: 'Formular nicht gefunden' },
      { status: 404 },
    );
  }

  if (!canEditForm(user, existing)) {
    return NextResponse.json(
      { error: 'Keine Berechtigung' },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const updated = await updateFormConfig(slug, body, user.id);
  if (!updated) {
    return NextResponse.json(
      { error: 'Formular nicht gefunden' },
      { status: 404 },
    );
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const existing = await getFormConfig(slug);
  if (!existing) {
    return NextResponse.json(
      { error: 'Formular nicht gefunden' },
      { status: 404 },
    );
  }

  if (!canDeleteForm(user, existing)) {
    return NextResponse.json(
      { error: 'Keine Berechtigung' },
      { status: 403 },
    );
  }

  await deleteFormConfig(slug);
  return NextResponse.json({ ok: true });
}
