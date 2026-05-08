'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import {
  FileCheck,
  MapPin,
  Pencil,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { Block, FormConfig } from '@/lib/types';
import type { User as AppUser } from '@/lib/users';
import { canEditBlock, canDeleteBlock } from '@/lib/users';
import { getUserById } from '@/lib/users';
import { formatDate } from '@/lib/formatting';
import { useBlockFieldMutations } from '@/lib/use-block-field-mutations';
import { ConfirmDialog } from './confirm-dialog';
import { EditBlockSheet } from './builder/edit-block-sheet';

const BLOCK_ICONS: Record<string, LucideIcon> = {
  User,
  MapPin,
  FileCheck,
};

export function BlockCard({
  block,
  forms,
  currentUser,
}: {
  block: Block;
  forms: FormConfig[];
  currentUser: AppUser;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [liveBlock, setLiveBlock] = useState<Block>(block);

  // Keep liveBlock in sync with prop when sheet is closed
  useEffect(() => {
    if (!editOpen) setLiveBlock(block);
  }, [block, editOpen]);

  async function handleSaveBlock(
    blockId: string,
    updates: Partial<Pick<Block, 'title' | 'description' | 'icon'>>,
  ) {
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = (await res.json()) as Block;
      setLiveBlock(updated);
      router.refresh();
    }
  }

  const { addField, editField, deleteField, reorderFields } =
    useBlockFieldMutations(
      (id) => (id === liveBlock.id ? liveBlock.fields : null),
      (updated) => {
        setLiveBlock(updated);
        router.refresh();
      },
    );

  const canEdit = canEditBlock(currentUser, block);
  const usedInForms = forms.filter((f) =>
    f.blockRefs.some((ref) => ref.blockId === block.id),
  );
  const editorName = getUserById(block.updatedBy)?.name ?? block.updatedBy;
  const updatedDate = formatDate(block.updatedAt);
  const fieldCount = block.fields.length;
  const Icon = block.icon ? BLOCK_ICONS[block.icon] : undefined;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/blocks/${block.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        if (data.error) alert(data.error);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col pt-5">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <Icon className="text-muted-foreground size-5 shrink-0" />
            )}
            <h2 className="text-lg font-semibold">{block.title}</h2>
            {fieldCount > 0 && (
              <Badge variant="outline" className="ml-auto text-xs">
                {fieldCount} {fieldCount === 1 ? 'Feld' : 'Felder'}
              </Badge>
            )}
          </div>

          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}

          <div className="mt-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Felder
            </p>
            {fieldCount === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                Noch keine Felder.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {block.fields.map((field) => (
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
                Verwendet in
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
            Bearbeitet von {editorName} am {updatedDate}
          </p>
        </div>

        <div className="mt-5 flex w-full gap-2">
          <Button
            variant="outline"
            className="h-10 flex-1"
            disabled={!canEditBlock(currentUser, block)}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1.5 size-4" />
            Ändern
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-10 shrink-0"
            disabled={!canDeleteBlock(currentUser, block)}
            onClick={() => setConfirmOpen(true)}
            aria-label="Block löschen"
            title="Block löschen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>

      <EditBlockSheet
        block={liveBlock}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaveBlock={handleSaveBlock}
        onAddField={canEdit ? addField : undefined}
        onEditField={canEdit ? editField : undefined}
        onDeleteField={canEdit ? deleteField : undefined}
        onReorderFields={canEdit ? reorderFields : undefined}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Block löschen?"
        description={
          <>
            <strong>{block.title}</strong> wird unwiderruflich entfernt.
          </>
        }
        confirmLabel="Löschen"
        pendingLabel="Wird gelöscht..."
        pending={deleting}
        onConfirm={handleDelete}
      >
        {usedInForms.length > 0 && (
          <div>
            <p className="text-destructive mb-2 text-sm font-medium">
              Wird in folgenden Formularen verwendet:
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
