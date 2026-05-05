'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Plus } from 'lucide-react';
import type { Block, FormConfig } from '@/lib/types';
import type { User } from '@/lib/users';
import { FormCard } from './form-card';
import { BlockCard } from './block-card';
import { CreateFormDialog } from './create-form-dialog';
import { CreateBlockSheet } from './builder/create-block-sheet';

function CreateBlockButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-5" />
        Neuer Block
      </Button>
      <CreateBlockSheet
        open={open}
        onOpenChange={setOpen}
        onCreated={() => router.refresh()}
      />
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
  const [tab, setTab] = useState('formulare');

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="flex flex-col items-start gap-2">
        <TabsList className="h-10">
          <TabsTrigger value="formulare" className="px-6 text-[18px]">
            Formulare
          </TabsTrigger>
          <TabsTrigger value="bloecke" className="px-6 text-[18px]">
            Blöcke
          </TabsTrigger>
        </TabsList>
        <div className="flex w-full justify-end">
          {tab === 'formulare' ? (
            <CreateFormDialog
              currentUser={currentUser}
              existingForms={forms}
            />
          ) : (
            <CreateBlockButton />
          )}
        </div>
      </div>

      <TabsContent value="formulare" className="mt-6">
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

      <TabsContent value="bloecke" className="mt-6">
        {blocks.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Blöcke. Erstellen Sie Ihren ersten Block.
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
