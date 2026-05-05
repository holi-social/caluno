'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Separator,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import type { Block } from '@/lib/types';

export function AddBlockDialog({
  open,
  onOpenChange,
  existingBlocks,
  usedBlockIds,
  onSelectBlock,
  onCreateBlock,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBlocks: Block[];
  usedBlockIds: string[];
  onSelectBlock: (blockId: string) => void;
  onCreateBlock: (data: {
    title: string;
    description?: string;
    fields: [];
    required: boolean;
  }) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const usedSet = new Set(usedBlockIds);
  const availableBlocks = existingBlocks.filter((b) => !usedSet.has(b.id));

  function reset() {
    setShowCreate(false);
    setTitle('');
    setDescription('');
  }

  function handleCreate() {
    if (!title.trim()) return;
    onCreateBlock({
      title: title.trim(),
      description: description.trim() || undefined,
      fields: [],
      required: true,
    });
    reset();
  }

  if (showCreate) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Neuen Block erstellen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <Field>
              <FieldLabel htmlFor="block-title">Titel</FieldLabel>
              <Input
                id="block-title"
                placeholder="z.B. Persoenliche Daten"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="block-desc">
                Beschreibung (optional)
              </FieldLabel>
              <Input
                id="block-desc"
                placeholder="z.B. Grundlegende Informationen zur Person"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Zurueck
              </Button>
              <Button
                size="lg"
                onClick={handleCreate}
                disabled={!title.trim()}
              >
                Erstellen & hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Block hinzufügen</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Bestehenden Block auswählen oder neuen erstellen
          </p>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          {availableBlocks.length > 0 ? (
            availableBlocks.map((block) => (
              <button
                key={block.id}
                type="button"
                className="hover:border-primary hover:bg-accent cursor-pointer rounded-xl border p-4 text-left transition-colors"
                onClick={() => {
                  onSelectBlock(block.id);
                  reset();
                }}
              >
                <p className="text-base font-semibold">{block.title}</p>
                {block.description && (
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {block.description}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {block.fields.map((f) => (
                    <Badge
                      key={f.id}
                      variant="secondary"
                      className="text-sm"
                    >
                      {f.label}
                    </Badge>
                  ))}
                  {block.fields.length === 0 && (
                    <span className="text-muted-foreground text-sm">
                      Keine Felder
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Alle Blöcke werden bereits verwendet
            </p>
          )}

          <Separator />

          <button
            type="button"
            className="hover:border-primary hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-base font-semibold">
              Neuen Block erstellen
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
