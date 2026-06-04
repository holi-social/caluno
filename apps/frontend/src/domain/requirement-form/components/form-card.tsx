'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { Pencil, Share2, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
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
      toast.success('Link copied', { description: url });
    } catch {
      toast.error('Could not copy link', { description: url });
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
                Content
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
            Updated {new Date(form.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-5 flex w-full gap-2">
          <Button className="h-10 flex-1" onClick={handleShare}>
            <Share2 className="mr-1.5 size-4" />
            Share
          </Button>
          {locked ? (
            <Button variant="outline" className="h-10 flex-1" disabled>
              <Pencil className="mr-1.5 size-4" />
              Edit
            </Button>
          ) : (
            <Button asChild variant="outline" className="h-10 flex-1">
              <Link
                href={`/admin/${orgUId}/requirement-forms/${form.id}/builder`}
              >
                <Pencil className="mr-1.5 size-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            aria-label="Submissions"
            title="Submissions"
          >
            <Link
              href={`/admin/${orgUId}/requirement-forms/${form.id}/submissions`}
            >
              <Users className="size-4" />
            </Link>
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-10 shrink-0"
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete form"
              title="Delete form"
              disabled={locked}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete form?"
        description={
          <>
            <strong>{form.name}</strong> will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        pending={deleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
