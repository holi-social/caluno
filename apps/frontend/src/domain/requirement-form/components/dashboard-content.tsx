'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteBlock, deleteForm } from '../actions';
import { BlockCard } from './block-card';
import { CreateBlockButton } from './create-block-button';
import { CreateFormDialog } from './create-form-dialog';
import { FormCard } from './form-card';
import { ListControls } from './list-controls';

export function DashboardContent({
  forms,
  blocks,
  orgUId,
  orgUnitName,
  organizationId,
}: {
  forms: RequirementForm[];
  blocks: FormBlock[];
  orgUId: string;
  orgUnitName: string;
  organizationId: string;
}) {
  const [tab, setTab] = useState('forms');

  // --- Create flows ---
  const [createFormOpen, setCreateFormOpen] = useState(false);

  // --- Forms list controls ---
  const [formSearch, setFormSearch] = useState('');

  const visibleForms = useMemo(() => {
    let list = [...forms];
    const q = formSearch.trim().toLowerCase();
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    return list;
  }, [forms, formSearch]);

  // --- Blocks list controls ---
  const [blockSearch, setBlockSearch] = useState('');

  const visibleBlocks = useMemo(() => {
    let list = [...blocks];
    const q = blockSearch.trim().toLowerCase();
    if (q) list = list.filter((b) => b.title.toLowerCase().includes(q));
    return list;
  }, [blocks, blockSearch]);

  async function handleDeleteForm(id: string) {
    const result = await deleteForm({ organizationUnitId: orgUId, formId: id });
    if (result?.serverError) {
      toast.error(result.serverError);
      throw new Error(result.serverError);
    }
  }

  async function handleDeleteBlock(id: string) {
    const result = await deleteBlock({
      organizationUnitId: orgUId,
      blockId: id,
    });
    if (result?.serverError) {
      toast.error(result.serverError);
      throw new Error(result.serverError);
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="grid grid-cols-3 items-center gap-3">
        <div />
        <div className="flex justify-center">
          <TabsList className="h-12!">
            <TabsTrigger value="forms" className="rounded-xl px-9 text-base">
              Forms
            </TabsTrigger>
            <TabsTrigger value="blocks" className="rounded-xl px-9 text-base">
              Blocks
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex justify-end">
          {tab === 'forms' ? (
            <Button size="lg" onClick={() => setCreateFormOpen(true)}>
              <Plus className="mr-2 size-5" />
              Create Form
            </Button>
          ) : (
            <CreateBlockButton size="lg" />
          )}
        </div>
      </div>

      <TabsContent value="forms" className="mt-8">
        {forms.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            No forms yet. Create your first form.
          </p>
        ) : (
          <>
            <ListControls
              search={formSearch}
              onSearchChange={setFormSearch}
              searchPlaceholder="Search forms..."
              filters={[]}
            />
            {visibleForms.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                No forms match the current filters.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {visibleForms.map((f) => (
                  <FormCard
                    key={f.id}
                    form={f}
                    blocks={blocks}
                    orgUId={orgUId}
                    orgUnitName={orgUnitName}
                    onDelete={handleDeleteForm}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="blocks" className="mt-8">
        {blocks.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            No blocks yet. Create your first block.
          </p>
        ) : (
          <>
            <ListControls
              search={blockSearch}
              onSearchChange={setBlockSearch}
              searchPlaceholder="Search blocks..."
              filters={[]}
            />
            {visibleBlocks.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                No blocks match the current filters.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {visibleBlocks.map((b) => (
                  <BlockCard
                    key={b.id}
                    block={b}
                    forms={forms}
                    onDelete={handleDeleteBlock}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </TabsContent>

      <CreateFormDialog
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        orgUId={orgUId}
        organizationId={organizationId}
      />
    </Tabs>
  );
}
