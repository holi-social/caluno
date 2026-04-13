import { NextResponse } from 'next/server';
import { updateEntry } from '@/lib/store';
import type { Entry } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<Omit<Entry, 'id' | 'createdAt'>>;
    const updated = await updateEntry(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
