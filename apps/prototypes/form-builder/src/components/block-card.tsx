'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { Pencil, Trash2 } from 'lucide-react';
import type { Block, FormConfig, FormField } from '@/lib/types';
import type { User } from '@/lib/users';
import { canEditBlock, canDeleteBlock } from '@/lib/users';
import { getUserById } from '@/lib/users';
import { EditBlockSheet } from './builder/edit-block-sheet';

export function BlockCard({
  block,
  forms,
  currentUser,
}: {
  block: Block;
  forms: FormConfig[];
  currentUser: User;
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

  async function handleAddField(blockId: string, field: FormField) {
    const updatedFields = [...liveBlock.fields, field];
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Block;
      setLiveBlock(updated);
      router.refresh();
    }
  }

  async function handleEditField(
    blockId: string,
    fieldId: string,
    updates: Partial<FormField>,
  ) {
    const updatedFields = liveBlock.fields.map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f,
    );
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Block;
      setLiveBlock(updated);
      router.refresh();
    }
  }

  async function handleDeleteField(blockId: string, fieldId: string) {
    const updatedFields = liveBlock.fields.filter((f) => f.id !== fieldId);
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Block;
      setLiveBlock(updated);
      router.refresh();
    }
  }

  async function handleReorderFields(blockId: string, orderedFields: FormField[]) {
    const res = await fetch(`/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: orderedFields }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Block;
      setLiveBlock(updated);
      router.refresh();
    }
  }

  const usedInForms = forms.filter((f) =>
    f.blockRefs.some((ref) => ref.blockId === block.id),
  );
  const editorName = getUserById(block.updatedBy)?.name ?? block.updatedBy;
  const updatedDate = new Date(block.updatedAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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
      <CardContent className="flex flex-1 flex-col pt-1">
        <div className="mb-4 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{block.title}</h2>
          </div>
          {block.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {block.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {block.fields.map((field) => (
              <Badge key={field.id} variant="outline" className="text-xs">
                {field.label}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Bearbeitet von {editorName} am {updatedDate}
          </p>
          {usedInForms.length > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              Verwendet in: {usedInForms.map((f) => f.name).join(', ')}
            </p>
          )}
        </div>

        <div className="flex w-full gap-2 border-t pt-4">
          <Button
            variant="outline"
            className="h-10 flex-1"
            disabled={!canEditBlock(currentUser, block)}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1.5 size-4" />
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-10 shrink-0"
            disabled={!canDeleteBlock(currentUser, block)}
            onClick={() => setConfirmOpen(true)}
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
        onAddField={canEditBlock(currentUser, block) ? handleAddField : undefined}
        onEditField={canEditBlock(currentUser, block) ? handleEditField : undefined}
        onDeleteField={canEditBlock(currentUser, block) ? handleDeleteField : undefined}
        onReorderFields={canEditBlock(currentUser, block) ? handleReorderFields : undefined}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Block loeschen?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Sind Sie sicher, dass Sie <strong>{block.title}</strong> löschen möchten?
          </p>
          {usedInForms.length > 0 && (
            <div>
              <p className="text-destructive mb-2 text-sm font-medium">
                Dieser Block wird in folgenden Formularen verwendet:
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
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => setConfirmOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              className="h-10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Loeschen...' : 'Löschen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
