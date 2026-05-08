'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Plus } from 'lucide-react';
import type { Block, FormConfig } from '@/lib/types';
import type { User } from '@/lib/users';
import { getUserById } from '@/lib/users';
import { FormCard } from './form-card';
import { BlockCard } from './block-card';
import { CreateFormDialog } from './create-form-dialog';
import { CreateBlockSheet } from './builder/create-block-sheet';
import { ListControls } from './list-controls';

const ALL = '__all__';

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

  // --- Forms list controls ---
  const [formSearch, setFormSearch] = useState('');
  const [formAuthor, setFormAuthor] = useState(ALL);
  const [formOrg, setFormOrg] = useState(ALL);
  const [formSort, setFormSort] = useState<string>(
    currentUser.role === 'moderator' ? 'myOrgFirst' : 'updatedDesc',
  );

  const formAuthorOptions = useMemo(() => {
    const ids = Array.from(new Set(forms.map((f) => f.updatedBy)));
    return [
      { label: 'Alle Autoren', value: ALL },
      ...ids.map((id) => ({
        label: getUserById(id)?.name ?? id,
        value: id,
      })),
    ];
  }, [forms]);

  const formOrgOptions = useMemo(() => {
    const orgs = Array.from(new Set(forms.map((f) => f.organizationName)));
    return [
      { label: 'Alle Organisationen', value: ALL },
      ...orgs.map((o) => ({ label: o, value: o })),
    ];
  }, [forms]);

  const formSortOptions = useMemo(
    () => [
      { label: 'Datum (neueste zuerst)', value: 'updatedDesc' },
      { label: 'Organisation', value: 'organization' },
      ...(currentUser.role === 'moderator'
        ? [
            {
              label: `${currentUser.subOrg} zuerst`,
              value: 'myOrgFirst',
            },
          ]
        : []),
    ],
    [currentUser.role, currentUser.subOrg],
  );

  const visibleForms = useMemo(() => {
    let list = forms;
    const q = formSearch.trim().toLowerCase();
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    if (formAuthor !== ALL)
      list = list.filter((f) => f.updatedBy === formAuthor);
    if (formOrg !== ALL)
      list = list.filter((f) => f.organizationName === formOrg);

    const sorted = [...list];
    if (formSort === 'updatedDesc') {
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } else if (formSort === 'organization') {
      sorted.sort(
        (a, b) =>
          a.organizationName.localeCompare(b.organizationName) ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
    } else if (formSort === 'myOrgFirst') {
      const myOrg = currentUser.subOrg;
      sorted.sort((a, b) => {
        const aMine = a.organizationName === myOrg;
        const bMine = b.organizationName === myOrg;
        if (aMine !== bMine) return aMine ? -1 : 1;
        return (
          a.organizationName.localeCompare(b.organizationName) ||
          b.updatedAt.localeCompare(a.updatedAt)
        );
      });
    }
    return sorted;
  }, [forms, formSearch, formAuthor, formOrg, formSort, currentUser.subOrg]);

  // --- Blocks list controls ---
  const [blockSearch, setBlockSearch] = useState('');
  const [blockAuthor, setBlockAuthor] = useState(ALL);
  const [blockSort, setBlockSort] = useState<string>('updatedDesc');

  const blockAuthorOptions = useMemo(() => {
    const ids = Array.from(new Set(blocks.map((b) => b.updatedBy)));
    return [
      { label: 'Alle Autoren', value: ALL },
      ...ids.map((id) => ({
        label: getUserById(id)?.name ?? id,
        value: id,
      })),
    ];
  }, [blocks]);

  const blockSortOptions = [
    { label: 'Datum (neueste zuerst)', value: 'updatedDesc' },
    { label: 'Datum (aelteste zuerst)', value: 'updatedAsc' },
  ];

  const visibleBlocks = useMemo(() => {
    let list = blocks;
    const q = blockSearch.trim().toLowerCase();
    if (q) list = list.filter((b) => b.title.toLowerCase().includes(q));
    if (blockAuthor !== ALL)
      list = list.filter((b) => b.updatedBy === blockAuthor);
    const sorted = [...list];
    if (blockSort === 'updatedAsc') {
      sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    } else {
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return sorted;
  }, [blocks, blockSearch, blockAuthor, blockSort]);

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
          <>
            <ListControls
              search={formSearch}
              onSearchChange={setFormSearch}
              searchPlaceholder="Formulare suchen..."
              filters={[
                {
                  id: 'author',
                  label: 'Autor',
                  value: formAuthor,
                  options: formAuthorOptions,
                  onChange: setFormAuthor,
                },
                {
                  id: 'org',
                  label: 'Organisation',
                  value: formOrg,
                  options: formOrgOptions,
                  onChange: setFormOrg,
                },
              ]}
              sort={{
                value: formSort,
                options: formSortOptions,
                onChange: setFormSort,
              }}
            />
            {visibleForms.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                Keine Formulare entsprechen den aktuellen Filtern.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {visibleForms.map((config) => (
                  <FormCard
                    key={config.id}
                    config={config}
                    blocks={blocks}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="bloecke" className="mt-6">
        {blocks.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Blöcke. Erstellen Sie Ihren ersten Block.
          </p>
        ) : (
          <>
            <ListControls
              search={blockSearch}
              onSearchChange={setBlockSearch}
              searchPlaceholder="Blöcke suchen..."
              filters={[
                {
                  id: 'author',
                  label: 'Autor',
                  value: blockAuthor,
                  options: blockAuthorOptions,
                  onChange: setBlockAuthor,
                },
              ]}
              sort={{
                value: blockSort,
                options: blockSortOptions,
                onChange: setBlockSort,
              }}
            />
            {visibleBlocks.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                Keine Blöcke entsprechen den aktuellen Filtern.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {visibleBlocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    forms={forms}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
