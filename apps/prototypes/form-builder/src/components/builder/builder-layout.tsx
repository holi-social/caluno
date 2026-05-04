'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Separator } from '@repo/ui';
import { ArrowLeft, Plus, Redo2, Save, Undo2 } from 'lucide-react';
import Link from 'next/link';
import type { Block, BlockRef, FormConfig, FormField } from '@/lib/types';
import type { User } from '@/lib/users';
import { canEditBlock, canRemoveBlockFromForm } from '@/lib/users';
import { useUndoRedo } from '@/lib/use-undo-redo';
import { BlockCardBuilder } from './section-card';
import { AddBlockDialog } from './add-section-dialog';
import { EditBlockSheet } from './edit-block-sheet';
import { FormPreview } from './form-preview';

export function BuilderLayout({
  initialConfig,
  initialBlocks,
  currentUser,
}: {
  initialConfig: FormConfig;
  initialBlocks: Block[];
  currentUser: User;
}) {
  const {
    state: config,
    set: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<FormConfig>(initialConfig);

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [editBlockId, setEditBlockId] = useState<string | null>(null);

  // Build a map for quick block lookup
  const blockMap = new Map(blocks.map((b) => [b.id, b]));

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Refresh blocks from API
  const refreshBlocks = useCallback(async () => {
    const res = await fetch('/api/blocks');
    if (res.ok) {
      const data = await res.json();
      setBlocks(data);
    }
  }, []);

  // --- Form-level handlers (tracked by undo/redo) ---

  function handleAddBlockRef(blockId: string) {
    setConfig((prev) => {
      const maxOrder = prev.blockRefs.reduce(
        (max, r) => Math.max(max, r.order),
        -1,
      );
      return {
        ...prev,
        blockRefs: [...prev.blockRefs, { blockId, order: maxOrder + 1 }],
      };
    });
  }

  function handleRemoveBlockRef(blockId: string) {
    setConfig((prev) => ({
      ...prev,
      blockRefs: prev.blockRefs.filter((r) => r.blockId !== blockId),
    }));
  }

  function handleToggleBlockRequired(blockId: string) {
    setConfig((prev) => ({
      ...prev,
      blockRefs: prev.blockRefs.map((r) => {
        if (r.blockId !== blockId) return r;
        const block = blockMap.get(blockId);
        const currentEffective = r.required ?? block?.required ?? true;
        return { ...r, required: !currentEffective };
      }),
    }));
  }

  function handleMoveBlock(blockId: string, direction: 'up' | 'down') {
    setConfig((prev) => {
      const sorted = [...prev.blockRefs].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((r) => r.blockId === blockId);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const temp = sorted[idx]!.order;
      sorted[idx] = { ...sorted[idx]!, order: sorted[swapIdx]!.order };
      sorted[swapIdx] = { ...sorted[swapIdx]!, order: temp };
      return { ...prev, blockRefs: sorted };
    });
  }

  // --- Block content handlers (go to API, NOT in undo stack) ---

  async function handleBlockFieldAdd(blockId: string, field: FormField) {
    const block = blockMap.get(blockId);
    if (!block) return;
    const updatedFields = [...block.fields, field];
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (res.ok) await refreshBlocks();
  }

  async function handleBlockFieldEdit(
    blockId: string,
    fieldId: string,
    updates: Partial<FormField>,
  ) {
    const block = blockMap.get(blockId);
    if (!block) return;
    const updatedFields = block.fields.map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f,
    );
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (res.ok) await refreshBlocks();
  }

  async function handleBlockFieldDelete(blockId: string, fieldId: string) {
    const block = blockMap.get(blockId);
    if (!block) return;
    const updatedFields = block.fields.filter((f) => f.id !== fieldId);
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (res.ok) await refreshBlocks();
  }

  async function handleBlockFieldReorder(
    blockId: string,
    orderedFields: FormField[],
  ) {
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: orderedFields }),
    });
    if (res.ok) await refreshBlocks();
  }

  async function handleBlockEdit(
    blockId: string,
    updates: Partial<Pick<Block, 'title' | 'description' | 'icon'>>,
  ) {
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) await refreshBlocks();
  }

  // --- Save form ---

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/forms/${config.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  // Sorted blockRefs for display
  const sortedRefs = [...config.blockRefs].sort((a, b) => a.order - b.order);

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Editor */}
      <div className="flex-1 overflow-y-auto border-r">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {/* Back + Breadcrumb */}
          <div className="mb-3 flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl"
            >
              <Link href="/">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <p className="text-muted-foreground text-sm font-medium">
              {config.organizationName} &rsaquo; {config.name}
            </p>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{config.name}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
                disabled={!canUndo}
                onClick={undo}
                aria-label="Rueckgaengig"
              >
                <Undo2 className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
                disabled={!canRedo}
                onClick={redo}
                aria-label="Wiederholen"
              >
                <Redo2 className="size-5" />
              </Button>
            </div>
          </div>

          {/* Block cards */}
          <div className="space-y-4">
            {sortedRefs.map((ref, idx) => {
              const block = blockMap.get(ref.blockId);
              if (!block) return null;
              return (
                <BlockCardBuilder
                  key={ref.blockId}
                  block={block}
                  blockRef={ref}
                  isFirst={idx === 0}
                  isLast={idx === sortedRefs.length - 1}
                  onToggleRequired={() =>
                    handleToggleBlockRequired(ref.blockId)
                  }
                  onMoveUp={() => handleMoveBlock(ref.blockId, 'up')}
                  onMoveDown={() => handleMoveBlock(ref.blockId, 'down')}
                  onRemove={
                    canRemoveBlockFromForm(currentUser)
                      ? () => handleRemoveBlockRef(ref.blockId)
                      : undefined
                  }
                  onEditBlock={
                    canEditBlock(currentUser, block)
                      ? () => setEditBlockId(ref.blockId)
                      : undefined
                  }
                />
              );
            })}
          </div>

          <Separator className="my-8" />

          {/* Add block / Save */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="mr-2 size-5" />
              Block hinzufuegen
            </Button>

            <Button size="lg" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 size-5" />
              {saved
                ? 'Gespeichert!'
                : saving
                  ? 'Speichern...'
                  : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="bg-muted/30 w-[380px] shrink-0 overflow-y-auto p-6">
        <FormPreview config={config} blocks={blocks} />
      </div>

      {/* Add block dialog */}
      <AddBlockDialog
        open={addBlockOpen}
        onOpenChange={setAddBlockOpen}
        existingBlocks={blocks}
        usedBlockIds={config.blockRefs.map((r) => r.blockId)}
        onSelectBlock={(blockId) => {
          handleAddBlockRef(blockId);
          setAddBlockOpen(false);
        }}
        onCreateBlock={async (data) => {
          const res = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            const newBlock = (await res.json()) as Block;
            await refreshBlocks();
            handleAddBlockRef(newBlock.id);
            setAddBlockOpen(false);
          }
        }}
      />

      {/* Edit block sheet */}
      <EditBlockSheet
        block={editBlockId ? (blockMap.get(editBlockId) ?? null) : null}
        open={editBlockId !== null}
        onOpenChange={(open) => {
          if (!open) setEditBlockId(null);
        }}
        onSaveBlock={async (blockId, updates) => {
          await handleBlockEdit(blockId, updates);
        }}
        onAddField={
          editBlockId && blockMap.get(editBlockId) && canEditBlock(currentUser, blockMap.get(editBlockId)!)
            ? async (blockId, field) => {
                await handleBlockFieldAdd(blockId, field);
              }
            : undefined
        }
        onEditField={
          editBlockId && blockMap.get(editBlockId) && canEditBlock(currentUser, blockMap.get(editBlockId)!)
            ? async (blockId, fieldId, updates) => {
                await handleBlockFieldEdit(blockId, fieldId, updates);
              }
            : undefined
        }
        onDeleteField={
          editBlockId && blockMap.get(editBlockId) && canEditBlock(currentUser, blockMap.get(editBlockId)!)
            ? async (blockId, fieldId) => {
                await handleBlockFieldDelete(blockId, fieldId);
              }
            : undefined
        }
        onReorderFields={
          editBlockId && blockMap.get(editBlockId) && canEditBlock(currentUser, blockMap.get(editBlockId)!)
            ? async (blockId, orderedFields) => {
                await handleBlockFieldReorder(blockId, orderedFields);
              }
            : undefined
        }
      />
    </div>
  );
}
