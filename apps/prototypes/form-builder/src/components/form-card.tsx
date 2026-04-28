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
import { Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import type { FormConfig } from '@/lib/types';

export function FormCard({ config }: { config: FormConfig }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);


  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${config.slug}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col pt-6">
        <div className="mb-4 flex-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {config.organizationName}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{config.name}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {config.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {config.sections.flatMap((s) => s.fields).map((field) => (
              <Badge key={field.id} variant="outline" className="text-xs">
                {field.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex w-full gap-2 border-t pt-4">
          <Button asChild variant="outline" className="h-10 flex-1">
            <Link href={`/builder/${config.slug}`}>
              <Pencil className="mr-1.5 size-4" />
              Bearbeiten
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="size-10 shrink-0">
            <Link href={`/forms/${config.slug}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="size-10 shrink-0">
            <Link href={`/submissions/${config.slug}`}>
              <FileText className="size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-10 shrink-0"
            onClick={() => setConfirmOpen(true)}
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
            Sind Sie sicher, dass Sie <strong>{config.name}</strong> löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
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
              {deleting ? 'Löschen...' : 'Löschen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
