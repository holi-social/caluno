'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { FormBlock, FormBlockField } from '@repo/data';
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Separator,
  Textarea,
} from '@repo/ui';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import {
  createBlockField,
  deleteBlockField,
  updateBlock,
  updateBlockField,
} from '../actions';
import { ConfirmDialog } from './confirm-dialog';
import { FieldForm } from './field-form';

const editBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type EditBlockValues = z.infer<typeof editBlockSchema>;

export function EditBlockForm({
  block,
  orgUId,
}: {
  block: FormBlock;
  orgUId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addingField, setAddingField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<FormBlockField[]>(block.fields ?? []);

  const form = useForm<EditBlockValues>({
    resolver: zodResolver(editBlockSchema),
    defaultValues: {
      title: block.title,
      description: block.description ?? '',
      icon: block.icon ?? '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;

  const onSaveMeta = async (values: EditBlockValues) => {
    startTransition(async () => {
      const result = await updateBlock({
        organizationUnitId: orgUId,
        blockId: block.id,
        title: values.title,
        description: values.description || undefined,
        icon: values.icon || undefined,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        toast.success('Block saved');
      } else {
        toast.error('Failed to save block');
      }
    });
  };

  async function handleAddField(input: {
    type: string;
    label: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    systemKey?: string;
    options?: { label: string; value: string }[];
    documentUrl?: string;
    documentLabel?: string;
  }) {
    startTransition(async () => {
      const result = await createBlockField({
        organizationUnitId: orgUId,
        blockId: block.id,
        ...input,
        type: input.type as import('@repo/data').FieldType,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        setFields(result.data.fields ?? []);
        setAddingField(false);
        toast.success('Field added');
      } else {
        toast.error('Failed to add field');
      }
    });
  }

  async function handleEditField(
    fieldId: string,
    input: {
      label?: string;
      description?: string;
      placeholder?: string;
      required?: boolean;
      systemKey?: string;
      options?: { label: string; value: string }[];
      documentUrl?: string;
      documentLabel?: string;
    },
  ) {
    startTransition(async () => {
      const result = await updateBlockField({
        organizationUnitId: orgUId,
        fieldId,
        ...input,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        setFields(result.data.fields ?? []);
        setEditingFieldId(null);
        toast.success('Field updated');
      } else {
        toast.error('Failed to update field');
      }
    });
  }

  async function handleDeleteField(fieldId: string) {
    startTransition(async () => {
      const result = await deleteBlockField({
        organizationUnitId: orgUId,
        fieldId,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        setFields((prev) => prev.filter((f) => f.id !== fieldId));
        setDeletingFieldId(null);
        toast.success('Field deleted');
      } else {
        toast.error('Failed to delete field');
      }
    });
  }

  async function handleMoveField(fieldId: string, direction: 'up' | 'down') {
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= fields.length) return;

    const reordered = [...fields];
    const atIdx = reordered[idx];
    const atNewIdx = reordered[newIdx];
    if (!atIdx || !atNewIdx) return;
    reordered[idx] = atNewIdx;
    reordered[newIdx] = atIdx;

    // Update fieldOrder for both affected fields
    startTransition(async () => {
      const updates = [
        updateBlockField({
          organizationUnitId: orgUId,
          fieldId: atNewIdx.id,
          fieldOrder: idx,
        }),
        updateBlockField({
          organizationUnitId: orgUId,
          fieldId: atIdx.id,
          fieldOrder: newIdx,
        }),
      ];
      await Promise.all(updates);
      setFields(reordered);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`/admin/${orgUId}/requirement-forms/blocks`)
          }
        >
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <h1 className="page-title">Edit Block</h1>
      </div>

      {/* Block metadata */}
      <form onSubmit={handleSubmit(onSaveMeta)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="title">
            Block Title <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="title"
            type="text"
            disabled={isPending}
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          {errors.title && <FieldError>{errors.title.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            disabled={isPending}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          {errors.description && (
            <FieldError>{errors.description.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="icon">Icon</FieldLabel>
          <Input
            id="icon"
            type="text"
            placeholder="e.g. user"
            disabled={isPending}
            aria-invalid={!!errors.icon}
            {...register('icon')}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending || !isDirty} size="lg">
            <Save className="mr-2 size-4" />
            Save Block
          </Button>
        </div>
      </form>

      <Separator />

      {/* Fields section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Fields ({fields.length})</h2>
          {!addingField && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingFieldId(null);
                setAddingField(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add Field
            </Button>
          )}
        </div>

        {fields.length === 0 && !addingField && (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              No fields yet. Add your first field to this block.
            </p>
          </div>
        )}

        {fields.map((field, idx) =>
          editingFieldId === field.id ? (
            <FieldForm
              key={field.id}
              initial={field}
              onSubmit={(data) =>
                handleEditField(field.id, {
                  label: data.label,
                  description: data.description,
                  placeholder: data.placeholder,
                  required: data.required,
                  systemKey: data.systemKey,
                  options: data.options,
                  documentUrl: data.documentUrl,
                  documentLabel: data.documentLabel,
                })
              }
              onCancel={() => setEditingFieldId(null)}
            />
          ) : (
            <div
              key={field.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-destructive text-xs">*</span>
                  )}
                  {field.systemKey && (
                    <span className="text-muted-foreground text-xs">
                      (system)
                    </span>
                  )}
                </div>
                {field.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {field.description}
                  </p>
                )}
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === 0 || isPending}
                  onClick={() => handleMoveField(field.id, 'up')}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === fields.length - 1 || isPending}
                  onClick={() => handleMoveField(field.id, 'down')}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddingField(false);
                    setEditingFieldId(field.id);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8"
                  onClick={() => setDeletingFieldId(field.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ),
        )}

        {addingField && (
          <FieldForm
            onSubmit={(data) =>
              handleAddField({
                type: data.type,
                label: data.label,
                description: data.description,
                placeholder: data.placeholder,
                required: data.required,
                systemKey: data.systemKey,
                options: data.options,
                documentUrl: data.documentUrl,
                documentLabel: data.documentLabel,
              })
            }
            onCancel={() => setAddingField(false)}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deletingFieldId}
        onOpenChange={(open) => {
          if (!open) setDeletingFieldId(null);
        }}
        title="Delete field?"
        description="This field will be permanently removed from the block."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingFieldId) handleDeleteField(deletingFieldId);
        }}
      />
    </div>
  );
}
