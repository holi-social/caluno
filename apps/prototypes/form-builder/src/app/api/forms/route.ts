import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  listFormConfigs,
  createFormConfig,
  copyFormConfig,
} from '@/lib/store-configs';
import { getCurrentUserFromCookieValue, USER_COOKIE } from '@/lib/users';

export async function GET() {
  const configs = await listFormConfigs();
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'copy') {
    const body = (await request.json()) as {
      sourceSlug: string;
      name: string;
    };
    if (!body.sourceSlug || !body.name) {
      return NextResponse.json(
        { error: 'sourceSlug und name sind erforderlich' },
        { status: 400 },
      );
    }
    const copy = await copyFormConfig(body.sourceSlug, body.name, user.id);
    if (!copy) {
      return NextResponse.json(
        { error: 'Quellformular nicht gefunden' },
        { status: 404 },
      );
    }
    return NextResponse.json(copy, { status: 201 });
  }

  const body = (await request.json()) as {
    name: string;
    description?: string;
  };

  if (!body.name) {
    return NextResponse.json(
      { error: 'Name ist erforderlich' },
      { status: 400 },
    );
  }

  const config = await createFormConfig({
    name: body.name,
    description: body.description,
    createdBy: user.id,
  });
  return NextResponse.json(config, { status: 201 });
}
