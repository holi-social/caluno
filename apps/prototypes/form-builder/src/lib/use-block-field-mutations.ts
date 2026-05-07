'use client';

/**
 * Prototype shortcut: PUT /api/blocks/:id mutations for the four
 * field-level operations on a block. The canonical repo pattern
 * (apps/frontend/src/domain/*\/actions.ts) uses next-safe-action
 * server actions consumed via useTransition. Don't propagate this
 * hook's REST shape outside this prototype.
 */

import { useCallback } from 'react';
import type { Block, FormField } from './types';

async function putFields(
  blockId: string,
  fields: FormField[],
): Promise<Block | null> {
  const res = await fetch(`/api/blocks/${blockId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) return null;
  return (await res.json()) as Block;
}

export function useBlockFieldMutations(
  /** Returns the latest known fields for a given block id. */
  getFields: (blockId: string) => FormField[] | null,
  /** Called with the updated Block when the API returns 2xx. */
  onUpdated?: (block: Block) => void,
) {
  const apply = useCallback(
    async (blockId: string, fields: FormField[]) => {
      const updated = await putFields(blockId, fields);
      if (updated && onUpdated) onUpdated(updated);
    },
    [onUpdated],
  );

  const addField = useCallback(
    async (blockId: string, field: FormField) => {
      const fields = getFields(blockId);
      if (!fields) return;
      await apply(blockId, [...fields, field]);
    },
    [apply, getFields],
  );

  const editField = useCallback(
    async (
      blockId: string,
      fieldId: string,
      updates: Partial<FormField>,
    ) => {
      const fields = getFields(blockId);
      if (!fields) return;
      await apply(
        blockId,
        fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
      );
    },
    [apply, getFields],
  );

  const deleteField = useCallback(
    async (blockId: string, fieldId: string) => {
      const fields = getFields(blockId);
      if (!fields) return;
      await apply(
        blockId,
        fields.filter((f) => f.id !== fieldId),
      );
    },
    [apply, getFields],
  );

  const reorderFields = useCallback(
    async (blockId: string, ordered: FormField[]) => {
      await apply(blockId, ordered);
    },
    [apply],
  );

  return { addField, editField, deleteField, reorderFields };
}
