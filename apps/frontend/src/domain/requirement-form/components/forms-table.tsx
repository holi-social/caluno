'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { Loader2, Lock, Pencil, Share2, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { FormattedDate } from '@/components/formatted-date';
import { Link } from '@/i18n/navigation';
import { copyToClipboard } from '@/lib/clipboard';

function FormActions({
  form,
  orgUId,
  onDelete,
}: {
  form: RequirementForm;
  orgUId: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const t = useTranslations('RequirementForm.table');
  const tActions = useTranslations('RequirementForm.actions');
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleShare() {
    const url = `${window.location.origin}/f/${form.shareToken}`;
    void copyToClipboard(url, tActions('linkCopied'));
  }

  function handleDelete() {
    startDeleteTransition(() => onDelete(form.id));
  }

  return (
    <aside className="flex items-center gap-1">
      <Button
        size="icon-xs"
        variant="outline"
        tooltip={t('copyShareLinkAria')}
        aria-label={t('copyShareLinkAria')}
        onClick={handleShare}
      >
        <Share2 />
      </Button>
      <Button
        size="icon-xs"
        variant="outline"
        tooltip={t('editFormAria')}
        aria-label={t('editFormAria')}
        asChild
      >
        <Link href={`/admin/${orgUId}/requirement-forms/${form.id}/builder`}>
          <Pencil />
        </Link>
      </Button>
      <Button
        size="icon-xs"
        variant="outline"
        tooltip={t('submissionsAria')}
        aria-label={t('submissionsAria')}
        asChild
      >
        <Link
          href={`/admin/${orgUId}/requirement-forms/${form.id}/submissions`}
        >
          <Users />
        </Link>
      </Button>
      {form.submissionCount > 0 ? (
        <Button
          size="icon-xs"
          variant="outline"
          tooltip={t('cannotDeleteAria')}
          aria-label={t('cannotDeleteAria')}
          disabled
        >
          <Lock />
        </Button>
      ) : (
        <DeleteAlertDialog
          title={t('deleteFormAria')}
          description={t('deleteFormDescription', { name: form.name })}
          onDelete={handleDelete}
          trigger={
            <Button
              size="icon-xs"
              variant="destructive"
              tooltip={t('deleteFormAria')}
              aria-label={t('deleteFormAria')}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          }
        />
      )}
    </aside>
  );
}

export function FormsTable({
  forms,
  blocks,
  orgUId,
  onDelete,
}: {
  forms: RequirementForm[];
  blocks: FormBlock[];
  orgUId: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const t = useTranslations('RequirementForm.table');
  const tCommon = useTranslations('Common');
  const blockMap = new Map(blocks.map((b) => [b.id, b]));

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('description')}</TableHead>
            <TableHead>{t('blocks')}</TableHead>
            <TableHead>{t('updated')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => {
            const usedBlocks = (form.blockRefs ?? [])
              .map((ref) => blockMap.get(ref.blockId))
              .filter((b): b is FormBlock => b != null);

            return (
              <TableRow key={form.id}>
                <TableCell>
                  <Link
                    className="hover:underline font-medium"
                    href={`/admin/${orgUId}/requirement-forms/${form.id}/builder`}
                  >
                    {form.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {form.description ?? tCommon('dash')}
                </TableCell>
                <TableCell>
                  {usedBlocks.length === 0 ? (
                    <span className="text-muted-foreground text-sm">
                      {tCommon('dash')}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {usedBlocks.map((block) => (
                        <Badge
                          key={block.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {block.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <FormattedDate date={form.updatedAt} />
                </TableCell>
                <TableCell>
                  <FormActions
                    form={form}
                    orgUId={orgUId}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
