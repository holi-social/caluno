'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Switch,
} from '@repo/ui';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { Block, BlockRef } from '@/lib/types';
import { getBlockIcon } from '@/lib/block-icon';
import { FieldBadge } from './field-badge';

export function BlockCardBuilder({
  block,
  blockRef,
  isFirst,
  isLast,
  onToggleRequired,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEditBlock,
}: {
  block: Block;
  blockRef: BlockRef;
  isFirst: boolean;
  isLast: boolean;
  onToggleRequired: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove?: () => void;
  onEditBlock?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const icon = getBlockIcon(block.fields);
  const effectiveRequired = blockRef.required ?? block.required;

  return (
    <Card className="relative">
      <div className="flex items-start gap-4 p-5">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="text-muted-foreground cursor-grab">
            <GripVertical className="size-6" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={isFirst}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={isLast}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-3.5" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-muted-foreground">{icon}</div>
            )}
            <h3 className="text-lg font-semibold">{block.title}</h3>
          </div>
          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}

          {/* Block-level required toggle */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              {effectiveRequired ? 'Pflicht' : 'Optional'}
            </span>
            <Switch
              size="default"
              checked={effectiveRequired}
              onCheckedChange={onToggleRequired}
            />
          </div>

          {!expanded && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {block.fields.map((field) => (
                <FieldBadge key={field.id} field={field} />
              ))}
            </div>
          )}

          {expanded && (
            <div className="mt-3 space-y-3">
              <Separator />
              {block.fields.map((field) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="bg-muted/50 flex min-w-0 flex-1 flex-col items-start justify-start gap-1 rounded-lg px-4 py-3">
                    <span className="text-base font-semibold">
                      {field.label}
                    </span>
                    {field.description && (
                      <span className="text-muted-foreground text-sm">
                        {field.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {onRemove && (
                <div className="mt-2 flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-foreground hover:text-destructive"
                    onClick={() => {
                      if (block.fields.length >= 1) {
                        setDeleteOpen(true);
                      } else {
                        onRemove();
                      }
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Block entfernen
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {onEditBlock && (
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl"
              onClick={onEditBlock}
            >
              <Pencil className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {onRemove && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Block entfernen?
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Sind Sie sicher, dass Sie den Block{' '}
              <strong>{block.title}</strong> aus diesem Formular entfernen
              moechten? Der Block bleibt in der Bibliothek erhalten.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {block.fields.map((f) => (
                <Badge key={f.id} variant="outline" className="text-sm">
                  {f.label}
                </Badge>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                className="h-10"
                onClick={() => setDeleteOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="h-10"
                onClick={() => {
                  setDeleteOpen(false);
                  onRemove();
                }}
              >
                Entfernen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
