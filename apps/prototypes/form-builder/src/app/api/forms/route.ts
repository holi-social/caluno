import { NextResponse } from 'next/server';
import { listFormConfigs, createFormConfig } from '@/lib/store-configs';

export async function GET() {
  const configs = await listFormConfigs();
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name: string;
    organizationName: string;
    description?: string;
  };

  if (!body.name || !body.organizationName) {
    return NextResponse.json(
      { error: 'Name und Organisation sind erforderlich' },
      { status: 400 },
    );
  }

  const config = await createFormConfig(body);
  return NextResponse.json(config, { status: 201 });
}
