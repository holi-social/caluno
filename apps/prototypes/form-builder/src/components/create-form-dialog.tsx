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
} from '@repo/ui';
import { Plus } from 'lucide-react';

export function CreateFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  function reset() {
    setName('');
    setOrg('');
    setDescription('');
  }

  async function handleCreate() {
    if (!name.trim() || !org.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          organizationName: org.trim(),
          description: description.trim(),
        }),
      });
      if (res.ok) {
        const config = (await res.json()) as { slug: string };
        reset();
        setOpen(false);
        router.push(`/builder/${config.slug}`);
      }
    } finally {
      setCreating(false);
    }
  }

  const canCreate = name.trim() !== '' && org.trim() !== '';

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-5" />
        Neues Formular
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          setOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Neues Formular erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
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
            <Field>
              <FieldLabel htmlFor="form-org">Organisation</FieldLabel>
              <Input
                id="form-org"
                placeholder="z.B. Berliner Stadtmission"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="form-desc">Beschreibung (optional)</FieldLabel>
              <Input
                id="form-desc"
                placeholder="z.B. Registrierungsformular für neue Freiwillige"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <Button size="lg" variant="outline" onClick={() => { reset(); setOpen(false); }}>
                Abbrechen
              </Button>
              <Button size="lg" onClick={handleCreate} disabled={!canCreate || creating}>
                {creating ? 'Erstellen...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
