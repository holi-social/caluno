'use client';

import { useEffect, useRef, useState } from 'react';
import type { Block, FormField } from '@/lib/types';
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
  const [draft, setDraft] = useState<Block>(makeDraft);
  // Mirror state in a ref so handleClose can read the latest draft synchronously,
  // even when the EditBlockSheet's Save button updates state and closes in the same tick.
  const draftRef = useRef<Block>(draft);

  useEffect(() => {
    if (open) {
      const fresh = makeDraft();
      draftRef.current = fresh;
      setDraft(fresh);
    }
  }, [open]);

  function update(next: Block) {
    draftRef.current = next;
    setDraft(next);
  }

  function handleSaveBlock(
    _id: string,
    updates: Partial<Pick<Block, 'title' | 'description' | 'icon'>>,
  ) {
    update({ ...draftRef.current, ...updates });
  }

  function handleAddField(_id: string, field: FormField) {
    update({
      ...draftRef.current,
      fields: [...draftRef.current.fields, field],
    });
  }

  function handleEditField(
    _id: string,
    fieldId: string,
    updates: Partial<FormField>,
  ) {
    update({
      ...draftRef.current,
      fields: draftRef.current.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
    });
  }

  function handleDeleteField(_id: string, fieldId: string) {
    update({
      ...draftRef.current,
      fields: draftRef.current.fields.filter((f) => f.id !== fieldId),
    });
  }

  function handleReorderFields(_id: string, orderedFields: FormField[]) {
    update({ ...draftRef.current, fields: orderedFields });
  }

  function handleClose(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    const current = draftRef.current;
    onOpenChange(false);
    if (!isMeaningful(current)) return;
    void fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: current.title.trim() || DEFAULT_TITLE,
        description: current.description,
        fields: current.fields,
        required: current.required,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const realBlock = (await res.json()) as Block;
        onCreated?.(realBlock);
      })
      .catch(() => {
        // Network error: draft is lost. Acceptable for prototype.
      });
  }

  return (
    <EditBlockSheet
      block={open ? draft : null}
      open={open}
      onOpenChange={handleClose}
      onSaveBlock={handleSaveBlock}
      onAddField={handleAddField}
      onEditField={handleEditField}
      onDeleteField={handleDeleteField}
      onReorderFields={handleReorderFields}
    />
  );
}
