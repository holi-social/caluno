import { NextResponse } from 'next/server';
import { deleteFormConfig, getFormConfig, updateFormConfig } from '@/lib/store-configs';

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
  const body = (await request.json()) as Record<string, unknown>;
  const updated = await updateFormConfig(slug, body);
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
  const deleted = await deleteFormConfig(slug);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Formular nicht gefunden' },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
