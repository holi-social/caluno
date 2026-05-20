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
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatting';
import { getFieldDisplayLabel } from '@/lib/predefined-fields';
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

  async function handleCommitBlock(
    updated: Block,
    options: { requestResubmit: boolean },
  ) {
    const res = await fetch(`/api/blocks/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updated.title,
        description: updated.description,
        icon: updated.icon,
        fields: updated.fields,
        required: updated.required,
      }),
    });
    if (!res.ok) {
      toast.error('Block konnte nicht gespeichert werden.');
      return;
    }
    const saved = (await res.json()) as Block;
    setLiveBlock(saved);
    router.refresh();
    if (options.requestResubmit) {
      toast.success(
        'Block gespeichert. Freiwillige werden zur Neueinreichung aufgefordert.',
      );
    } else {
      toast.success('Block gespeichert.');
    }
  }

  async function handleCreateCopy(
    editedBlock: Block,
    copyTitle: string,
  ): Promise<Block> {
    const createRes = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: copyTitle,
        description: editedBlock.description,
        icon: editedBlock.icon,
        fields: editedBlock.fields,
        required: editedBlock.required,
      }),
    });
    const newBlock = (await createRes.json()) as Block;
    router.refresh();
    toast.success(`Kopie „${copyTitle}" erstellt.`);
    return newBlock;
  }

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
                    {getFieldDisplayLabel(field)}
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
        forms={forms}
        canEdit={canEdit}
        open={editOpen}
        onOpenChange={setEditOpen}
        onCommit={handleCommitBlock}
        onCreateCopy={canEdit ? handleCreateCopy : undefined}
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
