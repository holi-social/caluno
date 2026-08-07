'use client';

import type { FormBlock } from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowDown, ArrowUp, Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BuilderBlockRef } from './form-builder-state';

interface FormBuilderBlockListProps {
  blockRefs: BuilderBlockRef[];
  availableBlocks: FormBlock[];
  hasSubmissions: boolean;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (index: number) => void;
  onEditBlock: (block: FormBlock) => void;
  onAddBlock: () => void;
}

export function FormBuilderBlockList({
  blockRefs,
  availableBlocks,
  hasSubmissions,
  onMove,
  onRemove,
  onEditBlock,
  onAddBlock,
}: FormBuilderBlockListProps) {
  const t = useTranslations('RequirementForm.builder');
  const tCommon = useTranslations('Common');

  return (
    <>
      {blockRefs.map((ref, index) => {
        const block = availableBlocks.find((b) => b.id === ref.blockId);
        if (!block) return null;
        const editLabel = hasSubmissions ? t('viewBlock') : t('editBlock');
        return (
          <div key={ref.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{block.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('fieldsCount', { count: block.fields?.length ?? 0 })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!hasSubmissions && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      tooltip={tCommon('moveUp')}
                      disabled={index === 0}
                      onClick={() => onMove(index, 'up')}
                      aria-label={tCommon('moveUp')}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      tooltip={tCommon('moveDown')}
                      disabled={index === blockRefs.length - 1}
                      onClick={() => onMove(index, 'down')}
                      aria-label={tCommon('moveDown')}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      tooltip={tCommon('delete')}
                      onClick={() => onRemove(index)}
                      aria-label={tCommon('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!block.isEditable && !hasSubmissions ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    tooltip={t('lockedTooltip')}
                    disabled
                    aria-label={t('lockedTooltip')}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    tooltip={editLabel}
                    onClick={() => onEditBlock(block)}
                    aria-label={editLabel}
                  >
                    {hasSubmissions ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Edit3 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {block.fields?.map((field) => (
                <div
                  key={field.id}
                  className="rounded bg-muted px-3 py-2 text-sm"
                >
                  <span className="font-medium">{field.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({field.type})
                  </span>
                  {field.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!hasSubmissions && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('addAnotherBlockHint')}
          </p>
          <Button variant="outline" onClick={onAddBlock}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addBlock')}
          </Button>
        </div>
      )}
    </>
  );
}
