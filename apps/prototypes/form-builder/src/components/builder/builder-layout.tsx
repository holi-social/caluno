'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@repo/ui';
import { ArrowLeft, Plus, Redo2, Save, Undo2, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Block, FormConfig, FormField } from '@/lib/types';
import type { User } from '@/lib/users';
import { canEditBlock, canRemoveBlockFromForm } from '@/lib/users';
import { useUndoRedo } from '@/lib/use-undo-redo';
import { BlockCardBuilder } from './section-card';
import { AddBlockDialog } from './add-section-dialog';
import { EditBlockSheet } from './edit-block-sheet';
import { CreateBlockSheet } from './create-block-sheet';
import { FormPreview } from './form-preview';

// --- Application rules section (prototype: dummy, no backend mapping) ---

type Rule = { id: string; trigger: string; location: string };

const TRIGGER_TYPES = [
  { value: 'join', label: 'Beitritt zur Organisation' },
  { value: 'shift', label: 'Schichtanmeldung' },
];

const LOCATIONS = [
  { value: 'current', label: 'Aktueller Standort' },
  { value: 'ks13', label: 'Karlstraße 13' },
  { value: 'ea', label: 'Abteilung EA' },
  { value: 'berlin', label: 'Standort Berlin' },
  { value: 'hamburg', label: 'Standort Hamburg' },
];

function makeRule(): Rule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trigger: 'join',
    location: 'current',
  };
}

function AppliedToSection({
  onChange,
  hasError,
}: {
  appliedTo: string[];
  onChange: (next: string[]) => void;
  hasError: boolean;
}) {
  const [rules, setRules] = useState<Rule[]>(() => [makeRule()]);

  // Sync the default rule to parent on mount so save validation passes.
  useEffect(() => {
    onChange(rules.map((r) => `${r.trigger}:${r.location}`));
    // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
  }, []);

  function commit(next: Rule[]) {
    setRules(next);
    onChange(next.map((r) => `${r.trigger}:${r.location}`));
  }

  function addRule() {
    commit([...rules, makeRule()]);
  }

  function updateRule(id: string, updates: Partial<Rule>) {
    commit(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function removeRule(id: string) {
    if (rules.length <= 1) return;
    commit(rules.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Anwendungsregeln</h2>
      <p className="text-muted-foreground mt-6 text-sm font-semibold uppercase tracking-wider">
        Freiwillige müssen ausfüllen, wenn:
      </p>
      <div className="mt-4 space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-1">
            <Select
              value={rule.trigger}
              onValueChange={(v) => updateRule(rule.id, { trigger: v })}
            >
              <SelectTrigger size="default" className="h-10 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground px-1 text-sm">bei</span>
            <Select
              value={rule.location}
              onValueChange={(v) => updateRule(rule.id, { location: v })}
            >
              <SelectTrigger size="default" className="h-10 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-10 shrink-0"
              onClick={() => removeRule(rule.id)}
              disabled={rules.length <= 1}
              aria-label="Regel entfernen"
              title="Regel entfernen"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="md" className="mt-4" onClick={addRule}>
        <Plus className="mr-1.5 size-4" />
        Regel hinzufügen
      </Button>
      {hasError && (
        <p className="text-destructive mt-1.5 text-sm">
          Bitte fügen Sie mindestens eine Regel hinzu.
        </p>
      )}
    </div>
  );
}

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
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [appliedToError, setAppliedToError] = useState(false);

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
    const appliedTo = config.appliedTo ?? [];
    if (appliedTo.length === 0) {
      setAppliedToError(true);
      toast.warning(
        'Das Formular ist keinem Einsatzbereich zugewiesen und wird niemandem angezeigt.',
      );
      return;
    }
    setAppliedToError(false);

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

          {/* Add block */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="mr-2 size-5" />
              Block hinzufügen
            </Button>
          </div>

          <Separator className="my-8" />

          {/* Applied-to section */}
          <AppliedToSection
            appliedTo={config.appliedTo ?? []}
            onChange={(next) => {
              setAppliedToError(false);
              setConfig((prev) => ({ ...prev, appliedTo: next }));
            }}
            hasError={appliedToError}
          />

          {/* Save */}
          <div className="mt-8 flex justify-end">
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
        onRequestCreate={() => {
          setAddBlockOpen(false);
          setCreateBlockOpen(true);
        }}
      />

      {/* Create block sheet (draft, persists only if user fills it in) */}
      <CreateBlockSheet
        open={createBlockOpen}
        onOpenChange={setCreateBlockOpen}
        onCreated={async (block) => {
          await refreshBlocks();
          handleAddBlockRef(block.id);
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
