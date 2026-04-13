import { NextResponse } from 'next/server';
import { createEntry } from '@/lib/store';
import type { Action } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: Action };

    if (!body.action || !['starting', 'finishing', 'break'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const entry = await createEntry({ action: body.action });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
