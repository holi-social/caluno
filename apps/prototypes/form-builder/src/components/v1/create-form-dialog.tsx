'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Copy, Plus } from 'lucide-react';
import type { FormConfig } from '@/lib/types';
import type { User } from '@/lib/users';

export function CreateFormDialog({
  currentUser,
  existingForms,
}: {
  currentUser: User;
  existingForms: FormConfig[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'copy'>('create');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceSlug, setSourceSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const isModerator = currentUser.role === 'moderator';
  const isCopy = isModerator || mode === 'copy';

  function reset() {
    setName('');
    setDescription('');
    setSourceSlug('');
  }

  function openDialog(m: 'create' | 'copy') {
    setMode(m);
    setOpen(true);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    if (isCopy && !sourceSlug) return;

    setCreating(true);
    try {
      let res: Response;
      if (isCopy) {
        res = await fetch('/api/forms?action=copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceSlug,
            name: name.trim(),
          }),
        });
      } else {
        res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        });
      }
      if (res.ok) {
        const config = (await res.json()) as { slug: string };
        reset();
        setOpen(false);
        router.push(`/v1/builder/${config.slug}`);
      }
    } finally {
      setCreating(false);
    }
  }

  const canCreate = isCopy
    ? name.trim() !== '' && sourceSlug !== ''
    : name.trim() !== '';

  return (
    <>
      {isModerator ? (
        <Button size="lg" onClick={() => openDialog('copy')}>
          <Copy className="mr-2 size-5" />
          Formular kopieren
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => openDialog('copy')}
          >
            <Copy className="mr-2 size-5" />
            Formular kopieren
          </Button>
          <Button size="lg" onClick={() => openDialog('create')}>
            <Plus className="mr-2 size-5" />
            Neues Formular
          </Button>
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          setOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isCopy
                ? 'Formular kopieren'
                : 'Neues Formular erstellen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {isCopy && (
              <Field>
                <FieldLabel htmlFor="source-form">Vorlage</FieldLabel>
                <Select value={sourceSlug} onValueChange={setSourceSlug}>
                  <SelectTrigger id="source-form" size="default" className="h-11 w-full text-base">
                    <SelectValue placeholder="Formular auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {existingForms.map((f) => (
                      <SelectItem key={f.slug} value={f.slug}>
                        {f.name} ({f.organizationName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="form-name">Name</FieldLabel>
              <Input
                id="form-name"
                placeholder="z.B. Onboarding Ehrenamt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            {!isCopy && (
              <Field>
                <FieldLabel htmlFor="form-desc">
                  Beschreibung (optional)
                </FieldLabel>
                <Input
                  id="form-desc"
                  placeholder="z.B. Registrierungsformular für neue Freiwillige"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-11 text-base"
                />
              </Field>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
              >
                Abbrechen
              </Button>
              <Button
                size="lg"
                onClick={handleCreate}
                disabled={!canCreate || creating}
              >
                {creating
                  ? isCopy
                    ? 'Wird kopiert...'
                    : 'Wird erstellt...'
                  : isCopy
                    ? 'Kopieren'
                    : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
