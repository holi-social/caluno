'use client';

import type { Block } from '@/lib/types';
import { EditBlockSheet } from './edit-block-sheet';

const DRAFT_ID = '__draft__';
const DEFAULT_TITLE = 'Neuer Block';

function makeDraft(): Block {
  const now = new Date().toISOString();
  return {
    id: DRAFT_ID,
    title: DEFAULT_TITLE,
    fields: [],
    required: true,
    createdBy: '',
    updatedBy: '',
    createdAt: now,
    updatedAt: now,
  };
}

// Persist iff the user actually did something: typed a real title or added a field.
function isMeaningful(b: Block): boolean {
  if (b.fields.length > 0) return true;
  const title = b.title.trim();
  return title !== '' && title !== DEFAULT_TITLE;
}

export function CreateBlockSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (block: Block) => void;
}) {
  // EditBlockSheet now owns the draft internally (via its `localFields` +
  // title/description state, seeded from this `block` prop on open). We
  // only need a static seed; the user's edits never write back here.
  const draft = makeDraft();

  async function handleCommit(updated: Block) {
    if (!isMeaningful(updated)) return;
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updated.title.trim() || DEFAULT_TITLE,
        description: updated.description,
        icon: updated.icon,
        fields: updated.fields,
        required: updated.required,
      }),
    });
    if (!res.ok) return;
    const realBlock = (await res.json()) as Block;
    onCreated?.(realBlock);
  }

  return (
    <EditBlockSheet
      block={open ? draft : null}
      open={open}
      onOpenChange={onOpenChange}
      onCommit={handleCommit}
    />
  );
}
