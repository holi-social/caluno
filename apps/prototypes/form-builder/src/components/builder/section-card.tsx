'use client';

import { useState } from 'react';
import { Badge, Button, Card } from '@repo/ui';
import { ConfirmDialog } from '../confirm-dialog';
import { BlockSummaryPreview } from '../block-summary-preview';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { Block } from '@/lib/types';
import { getBlockIcon } from '@/lib/block-icon';
import { FieldBadge } from './field-badge';

export function BlockCardBuilder({
  block,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEditBlock,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove?: () => void;
  onEditBlock?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const icon = getBlockIcon(block.fields);

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
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <h3 className="text-lg font-semibold">{block.title}</h3>
          </div>
          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}

          {!expanded && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {block.fields.map((field) => (
                <FieldBadge key={field.id} field={field} />
              ))}
            </div>
          )}

          {expanded && (
            <div className="mt-4 space-y-4">
              <BlockSummaryPreview block={block} />
              {onRemove && (
                <div className="flex items-center justify-end">
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
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Block entfernen?"
          description={
            <>
              Sind Sie sicher, dass Sie den Block{' '}
              <strong>{block.title}</strong> aus diesem Formular entfernen
              möchten? Der Block bleibt in der Bibliothek erhalten.
            </>
          }
          confirmLabel="Entfernen"
          onConfirm={() => {
            setDeleteOpen(false);
            onRemove();
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {block.fields.map((f) => (
              <Badge key={f.id} variant="outline" className="text-sm">
                {f.label}
              </Badge>
            ))}
          </div>
        </ConfirmDialog>
      )}
    </Card>
  );
}
