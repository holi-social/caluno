'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { Eye, Pencil, Share2, Trash2, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { ConfirmDialog } from './confirm-dialog';

export function FormCard({
  form,
  blocks,
  orgUId,
  orgUnitName,
  onDelete,
}: {
  form: RequirementForm;
  blocks: FormBlock[];
  orgUId: string;
  orgUnitName?: string;
  onDelete?: (id: string) => Promise<void>;
}) {
  const t = useTranslations('RequirementForm.card');
  const tTable = useTranslations('RequirementForm.table');
  const tActions = useTranslations('RequirementForm.actions');
  const { dateTime } = useFormatter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const locked = (form.submissionCount ?? 0) > 0;
  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  const usedBlocks = (form.blockRefs ?? [])
    .map((ref) => blockMap.get(ref.blockId))
    .filter((b): b is FormBlock => b != null);

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(form.id);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/f/${form.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(tActions('linkCopied'), { description: url });
    } catch {
      toast.error(tActions('couldNotCopyLink'), { description: url });
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col pt-5">
        <div className="flex flex-1 flex-col">
          {orgUnitName && (
            <p className="text-muted-foreground mb-1 text-xs">{orgUnitName}</p>
          )}
          <h2 className="mt-1 text-xl font-bold">{form.name}</h2>
          {form.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {form.description}
            </p>
          )}
          {usedBlocks.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {t('content')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {usedBlocks.map((block) => (
                  <Badge key={block.id} variant="outline" className="text-xs">
                    {block.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <p className="text-muted-foreground mt-4 text-xs">
            {t('updated', { date: dateTime(new Date(form.updatedAt)) })}
          </p>
        </div>

        <div className="mt-5 space-y-2 lg:flex lg:flex-col lg:gap-2 xl:flex-row xl:space-y-0">
          <div className="flex gap-2 sm:flex-col lg:flex-row">
            <Button
              className="h-10 flex-1 has-[>svg]:px-6"
              onClick={handleShare}
            >
              <Share2 className="mr-1.5 size-4" />
              {t('share')}
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 flex-1 has-[>svg]:px-6"
            >
              <Link
                href={`/admin/${orgUId}/requirement-forms/${form.id}/builder`}
              >
                {locked ? (
                  <>
                    <Eye className="mr-1.5 size-4" />
                    {t('view')}
                  </>
                ) : (
                  <>
                    <Pencil className="mr-1.5 size-4" />
                    {t('edit')}
                  </>
                )}
              </Link>
            </Button>
          </div>
          <div className="flex gap-2 sm:flex-col lg:flex-row">
            <Button
              asChild
              variant="outline"
              className="h-10 flex-1 has-[>svg]:px-6 xl:size-10 xl:flex-none xl:shrink-0"
              tooltip={t('submissions')}
              aria-label={t('submissions')}
            >
              <Link
                href={`/admin/${orgUId}/requirement-forms/${form.id}/submissions`}
              >
                <Users className="size-4" />
                <span className="ml-1.5 xl:hidden">{t('submissions')}</span>
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                className="text-muted-foreground hover:text-destructive h-10 flex-1 has-[>svg]:px-6 lg:size-10 lg:flex-none lg:shrink-0"
                tooltip={tTable('deleteFormAria')}
                aria-label={tTable('deleteFormAria')}
                disabled={locked}
                onClick={locked ? undefined : () => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                <span className="ml-1.5 hidden sm:block lg:hidden">
                  {t('delete')}
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('deleteFormTitle')}
        description={
          <>
            <strong>{form.name}</strong> {t('deleteFormDescription')}
          </>
        }
        confirmLabel={tTable('deleteFormAria')}
        pendingLabel={t('deleting')}
        pending={deleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
