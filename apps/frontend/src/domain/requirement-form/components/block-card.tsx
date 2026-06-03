'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import type { LucideIcon } from 'lucide-react';
import { Eye, FileCheck, MapPin, Pencil, Trash2, User } from 'lucide-react';
import { useState } from 'react';
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
            <div className="ml-auto flex items-center gap-1.5">
              {block.isEditable && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                >
                  Editable
                </Badge>
              )}
              {fieldCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {fieldCount} {fieldCount === 1 ? 'Field' : 'Fields'}
                </Badge>
              )}
            </div>
          </div>

          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}

          <div className="mt-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Fields
            </p>
            {fieldCount === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                No fields yet.
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
                Used in
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
            Updated {new Date(block.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-5 flex w-full gap-2">
          <Button
            variant="outline"
            className="h-10 flex-1"
            onClick={() => openSheet({ id: block.id })}
            disabled={locked}
          >
            {block.isEditable ? (
              <>
                <Pencil className="mr-1.5 size-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="mr-1.5 size-4" />
                View
              </>
            )}
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-10 shrink-0"
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete block"
              title="Delete block"
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
        title="Delete block?"
        description={
          <>
            <strong>{block.title}</strong> will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        pending={deleting}
        onConfirm={handleDelete}
      >
        {usedInForms.length > 0 && (
          <div>
            <p className="text-destructive mb-2 text-sm font-medium">
              Used in the following forms:
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
