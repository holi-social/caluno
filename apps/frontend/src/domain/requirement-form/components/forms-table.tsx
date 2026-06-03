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
import { Lock, Loader2, Pencil, Share2, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
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
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleShare() {
    const url = `${window.location.origin}/f/${form.shareToken}`;
    void copyToClipboard(url, 'Form link copied to clipboard');
  }

  function handleDelete() {
    startDeleteTransition(() => onDelete(form.id));
  }

  return (
    <aside className="flex items-center gap-1">
      <Button
        size="icon-xs"
        variant="outline"
        aria-label="Copy share link"
        onClick={handleShare}
      >
        <Share2 />
      </Button>
      <Button size="icon-xs" variant="outline" aria-label="Edit form" asChild>
        <Link href={`/${orgUId}/requirement-forms/${form.id}/builder`}>
          <Pencil />
        </Link>
      </Button>
      <Button size="icon-xs" variant="outline" aria-label="Submissions" asChild>
        <Link href={`/${orgUId}/requirement-forms/${form.id}/submissions`}>
          <Users />
        </Link>
      </Button>
      {form.submissionCount > 0 ? (
        <Button
          size="icon-xs"
          variant="outline"
          aria-label="Cannot delete — form has submissions"
          title="Cannot delete — form has submissions"
          disabled
        >
          <Lock />
        </Button>
      ) : (
        <DeleteAlertDialog
          title="Delete form?"
          description={`"${form.name}" will be permanently removed.`}
          onDelete={handleDelete}
          trigger={
            <Button
              size="icon-xs"
              variant="destructive"
              aria-label="Delete form"
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
  const blockMap = new Map(blocks.map((b) => [b.id, b]));

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Blocks</TableHead>
            <TableHead>Updated</TableHead>
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
                    href={`/${orgUId}/requirement-forms/${form.id}/builder`}
                  >
                    {form.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {form.description ?? '—'}
                </TableCell>
                <TableCell>
                  {usedBlocks.length === 0 ? (
                    <span className="text-muted-foreground text-sm">—</span>
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
                  {new Date(form.updatedAt).toLocaleDateString()}
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
