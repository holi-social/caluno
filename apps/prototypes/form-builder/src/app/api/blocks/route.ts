import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { listBlocks, createBlock } from '@/lib/store-blocks';
import { getCurrentUserFromCookieValue, USER_COOKIE } from '@/lib/users';

export async function GET() {
  const blocks = await listBlocks();
  return NextResponse.json(blocks);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const body = (await request.json()) as {
    title: string;
    description?: string;
    icon?: string;
    fields: unknown[];
    required: boolean;
  };

  if (!body.title) {
    return NextResponse.json(
      { error: 'Titel ist erforderlich' },
      { status: 400 },
    );
  }

  const block = await createBlock({
    title: body.title,
    description: body.description,
    icon: body.icon,
    fields: (body.fields ?? []) as Parameters<typeof createBlock>[0]['fields'],
    required: body.required ?? true,
    createdBy: user.id,
  });

  return NextResponse.json(block, { status: 201 });
}
