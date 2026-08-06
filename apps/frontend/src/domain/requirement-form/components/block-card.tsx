'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import type { LucideIcon } from 'lucide-react';
import { Eye, FileCheck, MapPin, Pencil, Trash2, User } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ActionTooltip } from '@/components/action-tooltip';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { ConfirmDialog } from './confirm-dialog';

const BLOCK_ICONS: Record<string, LucideIcon> = {
  User,
  MapPin,
  FileCheck,
};

export function BlockCard({
  block,
  forms,
  onDelete,
}: {
  block: FormBlock;
  forms: RequirementForm[];
  onDelete?: (id: string) => Promise<void>;
}) {
  const t = useTranslations('RequirementForm.card');
  const tTable = useTranslations('RequirementForm.table');
  const { dateTime } = useFormatter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { open: openSheet } = useSheetTrigger('block-form');

  const usedInForms = forms.filter((f) =>
    (f.blockRefs ?? []).some((ref) => ref.blockId === block.id),
  );
  const locked = usedInForms.some((f) => (f.submissionCount ?? 0) > 0);
  const fieldCount = block.fields?.length ?? 0;
  const Icon = block.icon ? BLOCK_ICONS[block.icon] : undefined;

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(block.id);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col pt-5">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="text-muted-foreground size-5 shrink-0" />}
            <h2 className="text-lg font-semibold">{block.title}</h2>
          </div>

          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}

          <div className="mt-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t('fields')}
            </p>
            {fieldCount === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                {t('noFieldsYet')}
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {block.fields?.map((field) => (
                  <Badge key={field.id} variant="outline" className="text-xs">
                    {field.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {usedInForms.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {t('usedIn')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {usedInForms.map((f) => (
                  <Badge key={f.id} variant="secondary" className="text-xs">
                    {f.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="text-muted-foreground mt-4 text-xs">
            {t('updated', { date: dateTime(new Date(block.updatedAt)) })}
          </p>
        </div>

        <div className="mt-5 flex w-full gap-2">
          <Button
            variant="outline"
            className="h-10 flex-1"
            onClick={() =>
              openSheet(
                locked ? { id: block.id, readOnly: 'true' } : { id: block.id },
              )
            }
          >
            {!locked && block.isEditable ? (
              <>
                <Pencil className="mr-1.5 size-4" />
                {t('edit')}
              </>
            ) : (
              <>
                <Eye className="mr-1.5 size-4" />
                {t('view')}
              </>
            )}
          </Button>
          {onDelete && (
            <ActionTooltip label={tTable('deleteBlockAria')}>
              {locked ? (
                <span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-10 shrink-0"
                    aria-label={tTable('deleteBlockAria')}
                    disabled
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-10 shrink-0"
                  onClick={() => setConfirmOpen(true)}
                  aria-label={tTable('deleteBlockAria')}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </ActionTooltip>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('deleteBlockTitle')}
        description={
          <>
            <strong>{block.title}</strong> {t('deleteBlockDescription')}
          </>
        }
        confirmLabel={tTable('deleteBlockAria')}
        pendingLabel={t('deleting')}
        pending={deleting}
        onConfirm={handleDelete}
      >
        {usedInForms.length > 0 && (
          <div>
            <p className="text-destructive mb-2 text-sm font-medium">
              {t('usedInForms')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {usedInForms.map((f) => (
                <Badge key={f.id} variant="outline" className="text-sm">
                  {f.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ConfirmDialog>
    </Card>
  );
}
