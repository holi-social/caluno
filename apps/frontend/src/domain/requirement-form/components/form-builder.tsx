'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { updateForm } from '../actions';

interface FormBuilderProps {
  form: RequirementForm;
  availableBlocks: FormBlock[];
  orgUId: string;
}

export function FormBuilder({
  form,
  availableBlocks,
  orgUId,
}: FormBuilderProps) {
  const router = useRouter();
  const [blockRefs, setBlockRefs] = useState(
    form.blockRefs
      ?.slice()
      .sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0)) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const { open: openBlockSheet } = useSheetTrigger('block-form');

  const hasSubmissions = (form.submissionCount ?? 0) > 0;

  const usedBlockIds = new Set(blockRefs.map((ref) => ref.blockId));

  function handleMove(index: number, direction: 'up' | 'down') {
    const newRefs = [...blockRefs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newRefs.length) return;
    const temp = newRefs[index];
    const swapItem = newRefs[swapIndex];
    if (!temp || !swapItem) return;
    newRefs[index] = swapItem;
    newRefs[swapIndex] = temp;
    setBlockRefs(newRefs.map((ref, i) => ({ ...ref, fieldOrder: i })));
  }

  function handleRemove(index: number) {
    const newRefs = blockRefs.filter((_, i) => i !== index);
    setBlockRefs(newRefs.map((ref, i) => ({ ...ref, fieldOrder: i })));
  }

  function handleAddExistingBlock(blockId: string) {
    setBlockRefs([
      ...blockRefs,
      {
        id: `temp-${Date.now()}`,
        formId: form.id,
        blockId,
        fieldOrder: blockRefs.length,
        required: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    setAddBlockOpen(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateForm({
        organizationUnitId: orgUId,
        formId: form.id,
        blockRefs: blockRefs.map((ref) => ({
          blockId: ref.blockId,
          order: ref.fieldOrder,
          required: ref.required ?? undefined,
        })),
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        toast.success('Form saved');
        router.refresh();
      } else {
        toast.error('Failed to save form');
      }
    } catch {
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyShareLink() {
    const url = `${window.location.origin}/f/${form.shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard');
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {hasSubmissions && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">This form has submissions</p>
              <p className="text-sm text-amber-800">
                Editing is disabled because volunteers have already submitted
                responses. Create a copy if you need a new version.
              </p>
            </div>
          </div>
        )}

        {blockRefs.map((ref, index) => {
          const block = availableBlocks.find((b) => b.id === ref.blockId);
          if (!block) return null;
          return (
            <div
              key={ref.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{block.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {block.fields?.length ?? 0} fields
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!hasSubmissions && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === blockRefs.length - 1}
                        onClick={() => handleMove(index, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      openBlockSheet({
                        id: block.id,
                        ...(hasSubmissions && { readOnly: 'true' }),
                      })
                    }
                    title={hasSubmissions ? 'View block' : 'Edit block'}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {block.fields?.map((field) => (
                  <div
                    key={field.id}
                    className="rounded bg-muted px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{field.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({field.type})
                    </span>
                    {field.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!hasSubmissions && (
          <div className="flex gap-2">
            <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Existing Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {availableBlocks
                    .filter((b) => !usedBlockIds.has(b.id))
                    .map((block) => (
                      <button
                        type="button"
                        key={block.id}
                        className="w-full rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                        onClick={() => handleAddExistingBlock(block.id)}
                      >
                        <div className="font-medium">{block.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {block.fields?.length ?? 0} fields
                        </div>
                      </button>
                    ))}
                  {availableBlocks.filter((b) => !usedBlockIds.has(b.id))
                    .length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No available blocks. Create a new one below.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => openBlockSheet()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Block
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleCopyShareLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Share Link
          </Button>
          {!hasSubmissions && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Form'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="font-semibold mb-4">Preview</h3>
        <div className="space-y-4">
          {blockRefs.map((ref) => {
            const block = availableBlocks.find((b) => b.id === ref.blockId);
            if (!block) return null;
            return (
              <div key={ref.id} className="rounded-lg border bg-card p-4">
                <h4 className="font-medium">{block.title}</h4>
                <div className="mt-2 space-y-2">
                  {block.fields?.map((field) => (
                    <div key={field.id}>
                      <label
                        htmlFor={`preview-${field.id}`}
                        className="text-sm"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <div
                        id={`preview-${field.id}`}
                        className="mt-1 h-8 rounded border bg-background px-2 text-sm text-muted-foreground flex items-center"
                      >
                        {field.placeholder || field.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {blockRefs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Add blocks to see a preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
