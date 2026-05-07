'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Pencil, Share2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Block, FormConfig } from '@/lib/types';
import { formatRuleId } from '@/lib/trigger-options';
import type { User } from '@/lib/users';
import { canEditForm, canDeleteForm, getUserById } from '@/lib/users';
import { formatDate } from '@/lib/formatting';

export function FormCard({
  config,
  blocks,
  currentUser,
}: {
  config: FormConfig;
  blocks: Block[];
  currentUser: User;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  const usedBlocks = config.blockRefs
    .map((ref) => blockMap.get(ref.blockId))
    .filter((b): b is Block => b != null);

  const editorName = getUserById(config.updatedBy)?.name ?? config.updatedBy;
  const updatedDate = formatDate(config.updatedAt);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${config.slug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/forms/${config.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link kopiert', { description: url });
    } catch {
      toast.error('Link konnte nicht kopiert werden', { description: url });
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col pt-5">
        <div className="flex flex-1 flex-col">
          <p className="text-muted-foreground text-xs font-medium tracking-wide">
            Erstellt von {config.organizationName}
          </p>
          <h2 className="mt-1 text-xl font-bold">{config.name}</h2>
          {config.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {config.description}
            </p>
          )}
          {usedBlocks.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Inhalt
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
          {(config.appliedTo ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Aktiv bei
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {config.appliedTo.map((id) => (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {formatRuleId(id)}
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
          <Button className="h-10 flex-1" onClick={handleShare}>
            <Share2 className="mr-1.5 size-4" />
            Teilen
          </Button>
          <Button
            asChild={canEditForm(currentUser, config)}
            variant="outline"
            className="h-10 flex-1"
            disabled={!canEditForm(currentUser, config)}
          >
            {canEditForm(currentUser, config) ? (
              <Link href={`/builder/${config.slug}`}>
                <Pencil className="mr-1.5 size-4" />
                Ändern
              </Link>
            ) : (
              <>
                <Pencil className="mr-1.5 size-4" />
                Ändern
              </>
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            aria-label="Einsendungen"
            title="Einsendungen"
          >
            <Link href={`/submissions/${config.slug}`}>
              <Users className="size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-10 shrink-0"
            disabled={!canDeleteForm(currentUser, config)}
            onClick={() => setConfirmOpen(true)}
            aria-label="Formular löschen"
            title="Formular löschen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Formular löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            <strong>{config.name}</strong> wird unwiderruflich entfernt.
          </p>
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
              {deleting ? 'Wird gelöscht...' : 'Löschen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
