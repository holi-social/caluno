'use client';

import { useEffect, useState } from 'react';
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
import type { FormConfig } from '@/lib/types';

export function CreateFormDialog({
  open,
  onOpenChange,
  mode,
  existingForms,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'copy';
  existingForms: FormConfig[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceSlug, setSourceSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const isCopy = mode === 'copy';

  // Reset form state whenever the dialog opens (or the mode changes while open).
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSourceSlug('');
    }
  }, [open, mode]);

  async function handleCreate() {
    if (!name.trim()) return;
    if (isCopy && !sourceSlug) return;

    setCreating(true);
    try {
      const res = isCopy
        ? await fetch('/api/forms?action=copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceSlug,
              name: name.trim(),
            }),
          })
        : await fetch('/api/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim(),
            }),
          });
      if (res.ok) {
        const config = (await res.json()) as { slug: string };
        onOpenChange(false);
        router.push(`/builder/${config.slug}`);
      }
    } finally {
      setCreating(false);
    }
  }

  const canCreate = isCopy
    ? name.trim() !== '' && sourceSlug !== ''
    : name.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isCopy ? 'Formular kopieren' : 'Neues Formular erstellen'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {isCopy && (
            <Field>
              <FieldLabel htmlFor="source-form">Vorlage</FieldLabel>
              <Select value={sourceSlug} onValueChange={setSourceSlug}>
                <SelectTrigger
                  id="source-form"
                  size="default"
                  className="h-11 w-full text-base"
                >
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
              onClick={() => onOpenChange(false)}
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
  );
}
