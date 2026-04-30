import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBlock, updateBlock, deleteBlock } from '@/lib/store-blocks';
import { listFormConfigs } from '@/lib/store-configs';
import {
  getCurrentUserFromCookieValue,
  canEditBlock,
  canDeleteBlock,
  USER_COOKIE,
} from '@/lib/users';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const block = await getBlock(id);
  if (!block) {
    return NextResponse.json(
      { error: 'Block nicht gefunden' },
      { status: 404 },
    );
  }
  return NextResponse.json(block);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const block = await getBlock(id);
  if (!block) {
    return NextResponse.json(
      { error: 'Block nicht gefunden' },
      { status: 404 },
    );
  }

  if (!canEditBlock(user, block)) {
    return NextResponse.json(
      { error: 'Keine Berechtigung' },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const updated = await updateBlock(id, body, user.id);
  if (!updated) {
    return NextResponse.json(
      { error: 'Block nicht gefunden' },
      { status: 404 },
    );
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const block = await getBlock(id);
  if (!block) {
    return NextResponse.json(
      { error: 'Block nicht gefunden' },
      { status: 404 },
    );
  }

  if (!canDeleteBlock(user, block)) {
    return NextResponse.json(
      { error: 'Keine Berechtigung' },
      { status: 403 },
    );
  }

  // Check if any forms reference this block
  const forms = await listFormConfigs();
  const affectedForms = forms.filter((f) =>
    f.blockRefs.some((ref) => ref.blockId === id),
  );
  if (affectedForms.length > 0) {
    return NextResponse.json(
      {
        error: 'Block wird in Formularen verwendet',
        forms: affectedForms.map((f) => ({ slug: f.slug, name: f.name })),
      },
      { status: 409 },
    );
  }

  await deleteBlock(id);
  return NextResponse.json({ ok: true });
}
