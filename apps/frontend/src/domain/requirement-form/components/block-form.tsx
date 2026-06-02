'use client';

import { FieldType } from '@repo/data';
import { useBlock } from '@repo/data/react';
import {
  Button,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { toast } from 'sonner';
import { saveBlock } from '../actions';
import { OptionsEditor } from './options-editor';

interface BlockFormFieldInput {
  id?: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  documentUrl?: string;
  documentLabel?: string;
}

interface BlockFormData {
  title: string;
  description: string;
  icon: string;
  fields: BlockFormFieldInput[];
}

export function BlockForm({
  blockId,
  orgUId,
  organizationId,
  onPendingChange,
}: {
  blockId?: string;
  orgUId: string;
  organizationId: string;
  onPendingChange?: (isPending: boolean) => void;
}) {
  const isEdit = !!blockId;
  const blockQuery = useBlock(blockId ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting, errors },
  } = useForm<BlockFormData>({
    defaultValues: {
      title: '',
      description: '',
      icon: '',
      fields: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  // Sync fetched block data into form
  useEffect(() => {
    if (blockQuery.data) {
      reset({
        title: blockQuery.data.title,
        description: blockQuery.data.description ?? '',
        icon: blockQuery.data.icon ?? '',
        fields:
          blockQuery.data.fields?.map((f) => ({
            id: f.id,
            type: f.type as FieldType,
            label: f.label,
            description: f.description ?? '',
            placeholder: f.placeholder ?? '',
            required: f.required,
            options: f.options ?? [],
            documentUrl: f.documentUrl ?? '',
            documentLabel: f.documentLabel ?? '',
          })) ?? [],
      });
    }
  }, [blockQuery.data, reset]);

  useEffect(() => {
    onPendingChange?.(isSubmitting);
  }, [isSubmitting, onPendingChange]);

  useEffect(() => {
    if (blockQuery.isError) {
      toast.error('Failed to load block');
    }
  }, [blockQuery.isError]);

  const watchedFields = watch('fields');

  async function onSubmit(data: BlockFormData) {
    const result = await saveBlock({
      organizationUnitId: orgUId,
      organizationId,
      blockId,
      title: data.title,
      description: data.description || undefined,
      icon: data.icon || undefined,
      fields: data.fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        description: f.description || undefined,
        placeholder: f.placeholder || undefined,
        required: f.required,
        options: f.options,
        documentUrl: f.documentUrl || undefined,
        documentLabel: f.documentLabel || undefined,
      })),
    });

    if (result?.serverError) {
      toast.error(result.serverError);
    } else if (result?.data) {
      toast.success(isEdit ? 'Block saved' : 'Block created');
      if (!isEdit && result.data.blockId) {
        // After creating, we could redirect to edit mode or just close
        // For now, just reset to clear dirty state
        reset(data);
      } else {
        reset(data);
      }
    } else {
      toast.error('Failed to save block');
    }
  }

  function handleAddField() {
    append({
      type: FieldType.Text,
      label: '',
      description: '',
      placeholder: '',
      required: false,
      options: [],
    });
  }

  if (isEdit && blockQuery.isPending) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const showSaveButton = isDirty || !isEdit;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Metadata */}
      <div className="space-y-4">
        <Field>
          <FieldLabel>
            Block Title <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Personal Information"
          />
          {errors.title && (
            <p className="text-destructive text-sm">{errors.title.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            {...register('description')}
            placeholder="What does this block collect?"
          />
        </Field>

        <Field>
          <FieldLabel>Icon</FieldLabel>
          <Input {...register('icon')} placeholder="e.g. user" />
        </Field>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Fields ({fields.length})</h3>
          <Button type="button" variant="outline" onClick={handleAddField}>
            <Plus className="mr-2 size-4" />
            Add Field
          </Button>
        </div>

        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              No fields yet. Add your first field to this block.
            </p>
          </div>
        )}

        {fields.map((field, index) => (
          <FieldCard
            key={field.id}
            index={index}
            control={control}
            register={register}
            errors={errors.fields?.[index]}
            onRemove={() => remove(index)}
            onMoveUp={() => move(index, index - 1)}
            onMoveDown={() => move(index, index + 1)}
            canMoveUp={index > 0}
            canMoveDown={index < fields.length - 1}
            fieldType={watchedFields[index]?.type}
          />
        ))}
      </div>

      {/* Sticky Save */}
      <div className="sticky bottom-0 -mx-6 border-t bg-background px-6 py-4">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !showSaveButton}
        >
          <Save className="mr-2 size-4" />
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create block'}
        </Button>
      </div>
    </form>
  );
}

function FieldCard({
  index,
  control,
  register,
  errors,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  fieldType,
}: {
  index: number;
  control: Control<BlockFormData>;
  register: UseFormRegister<BlockFormData>;
  errors?: FieldErrors<BlockFormFieldInput>;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  fieldType?: FieldType;
}) {
  const showOptions =
    fieldType === FieldType.SingleChoice || fieldType === FieldType.MultiChoice;
  const isDocument = fieldType === FieldType.DocumentAcknowledgement;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Field {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            ↓
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel>
            Type <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            control={control}
            name={`fields.${index}.type`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FieldType.Text}>Text</SelectItem>
                  <SelectItem value={FieldType.Textarea}>Textarea</SelectItem>
                  <SelectItem value={FieldType.Email}>Email</SelectItem>
                  <SelectItem value={FieldType.Phone}>Phone</SelectItem>
                  <SelectItem value={FieldType.Numbers}>Number</SelectItem>
                  <SelectItem value={FieldType.Date}>Date</SelectItem>
                  <SelectItem value={FieldType.SingleChoice}>
                    Single Choice
                  </SelectItem>
                  <SelectItem value={FieldType.MultiChoice}>
                    Multi Choice
                  </SelectItem>
                  <SelectItem value={FieldType.Checkbox}>Checkbox</SelectItem>
                  <SelectItem value={FieldType.DocumentAcknowledgement}>
                    Document Acknowledgement
                  </SelectItem>
                  <SelectItem value={FieldType.StaticText}>
                    Static Text
                  </SelectItem>
                  <SelectItem value={FieldType.Name}>Name</SelectItem>
                  <SelectItem value={FieldType.Lastname}>Lastname</SelectItem>
                  <SelectItem value={FieldType.Zip}>ZIP</SelectItem>
                  <SelectItem value={FieldType.Iban}>IBAN</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel>
            Label <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register(`fields.${index}.label`, {
              required: 'Label is required',
            })}
            placeholder="Field label"
          />
          {errors?.label && (
            <p className="text-destructive text-sm">{errors.label.message}</p>
          )}
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <Input
            {...register(`fields.${index}.description`)}
            placeholder="Help text for this field"
          />
        </Field>

        <Field>
          <FieldLabel>Placeholder</FieldLabel>
          <Input
            {...register(`fields.${index}.placeholder`)}
            placeholder="e.g. Enter your name"
          />
        </Field>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id={`field-required-${index}`}
            {...register(`fields.${index}.required`)}
            className="size-4"
          />
          <label htmlFor={`field-required-${index}`} className="text-sm">
            Required
          </label>
        </div>

        {isDocument && (
          <>
            <Field className="md:col-span-2">
              <FieldLabel>Document URL</FieldLabel>
              <Input
                {...register(`fields.${index}.documentUrl`)}
                placeholder="https://example.com/document.pdf"
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Document Label</FieldLabel>
              <Input
                {...register(`fields.${index}.documentLabel`)}
                placeholder="e.g. Terms of Service"
              />
            </Field>
          </>
        )}
      </div>

      {showOptions && (
        <div className="md:col-span-2">
          <FieldLabel>Options</FieldLabel>
          <Controller
            control={control}
            name={`fields.${index}.options`}
            render={({ field }) => (
              <OptionsEditor
                options={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
