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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import type { Block, FormConfig } from '@/lib/types';
import type { User } from '@/lib/users';
import { FormCard } from './form-card';
import { BlockCard } from './block-card';
import { CreateFormDialog } from './create-form-dialog';

function CreateBlockDialog({ currentUser }: { currentUser: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  function reset() {
    setTitle('');
    setDescription('');
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          fields: [],
          required: true,
        }),
      });
      if (res.ok) {
        reset();
        setOpen(false);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-5" />
        Neuer Block
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
            <DialogTitle className="text-xl">
              Neuen Block erstellen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <Field>
              <FieldLabel htmlFor="block-title">Titel</FieldLabel>
              <Input
                id="block-title"
                placeholder="z.B. Persoenliche Daten"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="block-desc">
                Beschreibung (optional)
              </FieldLabel>
              <Input
                id="block-desc"
                placeholder="z.B. Grundlegende Informationen zur Person"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
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
                disabled={!title.trim() || creating}
              >
                {creating ? 'Erstellen...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DashboardContent({
  forms,
  blocks,
  currentUser,
}: {
  forms: FormConfig[];
  blocks: Block[];
  currentUser: User;
}) {
  return (
    <Tabs defaultValue="formulare">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="formulare">Formulare</TabsTrigger>
          <TabsTrigger value="bloecke">Bloecke</TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          <TabsContent value="formulare" className="mt-0">
            <CreateFormDialog
              currentUser={currentUser}
              existingForms={forms}
            />
          </TabsContent>
          <TabsContent value="bloecke" className="mt-0">
            <CreateBlockDialog currentUser={currentUser} />
          </TabsContent>
        </div>
      </div>

      <TabsContent value="formulare">
        {forms.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Formulare. Erstellen Sie Ihr erstes Formular.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((config) => (
              <FormCard
                key={config.id}
                config={config}
                blocks={blocks}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="bloecke">
        {blocks.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Bloecke. Erstellen Sie Ihren ersten Block.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {blocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                forms={forms}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
