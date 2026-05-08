'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import type { Block } from '@/lib/types';
import { getUserById } from '@/lib/users';
import { ListControls } from '../list-controls';

const ALL = '__all__';

export function AddBlockDialog({
  open,
  onOpenChange,
  existingBlocks,
  usedBlockIds,
  onSelectBlock,
  onRequestCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBlocks: Block[];
  usedBlockIds: string[];
  onSelectBlock: (blockId: string) => void;
  onRequestCreate: () => void;
}) {
  const usedSet = new Set(usedBlockIds);
  const availableBlocks = existingBlocks.filter((b) => !usedSet.has(b.id));

  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState(ALL);

  const authorOptions = useMemo(() => {
    const ids = Array.from(new Set(availableBlocks.map((b) => b.updatedBy)));
    return [
      { label: 'Alle Autoren', value: ALL },
      ...ids.map((id) => ({
        label: getUserById(id)?.name ?? id,
        value: id,
      })),
    ];
  }, [availableBlocks]);

  const visibleBlocks = useMemo(() => {
    let list = availableBlocks;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((b) => b.title.toLowerCase().includes(q));
    if (author !== ALL) list = list.filter((b) => b.updatedBy === author);
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [availableBlocks, search, author]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Block hinzufügen</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Bestehenden Block auswählen oder neuen erstellen
          </p>
        </DialogHeader>

        {availableBlocks.length > 0 && (
          <div className="pt-2">
            <ListControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Blöcke suchen..."
              searchSuggestions={availableBlocks.map((b) => b.title)}
              filters={[
                {
                  id: 'author',
                  label: 'Autor',
                  value: author,
                  options: authorOptions,
                  onChange: setAuthor,
                },
              ]}
            />
          </div>
        )}

        <div className="grid gap-3 pt-2">
          {availableBlocks.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Alle Blöcke werden bereits verwendet
            </p>
          ) : visibleBlocks.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Keine Blöcke entsprechen den aktuellen Filtern.
            </p>
          ) : (
            visibleBlocks.map((block) => (
              <button
                key={block.id}
                type="button"
                className="hover:border-primary hover:bg-accent cursor-pointer rounded-xl border p-4 text-left transition-colors"
                onClick={() => onSelectBlock(block.id)}
              >
                <p className="text-base font-semibold">{block.title}</p>
                {block.description && (
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {block.description}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {block.fields.map((f) => (
                    <Badge key={f.id} variant="secondary" className="text-sm">
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
          )}

          <Separator />

          <button
            type="button"
            className="hover:border-primary hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors"
            onClick={onRequestCreate}
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
