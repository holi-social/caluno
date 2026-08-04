'use client';

import type { FormBlock } from '@repo/data';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FormBuilderAddBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBlocks: FormBlock[];
  usedBlockIds: Set<string>;
  onSelectBlock: (blockId: string) => void;
  onCreateNew: () => void;
}

export function FormBuilderAddBlockDialog({
  open,
  onOpenChange,
  availableBlocks,
  usedBlockIds,
  onSelectBlock,
  onCreateNew,
}: FormBuilderAddBlockDialogProps) {
  const t = useTranslations('RequirementForm.builder');
  const unusedBlocks = availableBlocks.filter((b) => !usedBlockIds.has(b.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('addBlockTitle')}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t('addBlockDescription')}
          </p>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          {unusedBlocks.length > 0 ? (
            unusedBlocks.map((block) => (
              <button
                type="button"
                key={block.id}
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
                  {block.fields?.map((f) => (
                    <Badge key={f.id} variant="secondary" className="text-sm">
                      {f.label}
                    </Badge>
                  ))}
                  {(block.fields?.length ?? 0) === 0 && (
                    <span className="text-muted-foreground text-sm">
                      {t('noFields')}
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {t('allBlocksInUse')}
            </p>
          )}

          <Separator />

          <button
            type="button"
            className="hover:border-primary hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors"
            onClick={onCreateNew}
          >
            <Plus className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-base font-semibold">
              {t('createNewBlock')}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
