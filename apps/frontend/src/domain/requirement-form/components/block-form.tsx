'use client';

import { FieldType } from '@repo/data';
import { useBlock } from '@repo/data/react';
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@repo/ui';
import { FileText, Lock, Plus, Save, Trash2, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const SYSTEM_PRESETS = [
  { key: 'name', label: 'First name', type: FieldType.Name, required: true },
  {
    key: 'lastname',
    label: 'Last name',
    type: FieldType.Lastname,
    required: true,
  },
  {
    key: 'preferred-name',
    label: 'Preferred name',
    type: FieldType.Text,
    required: false,
  },
  {
    key: 'email',
    label: 'Email address',
    type: FieldType.Email,
    required: true,
  },
  {
    key: 'phone',
    label: 'Phone number',
    type: FieldType.Phone,
    required: false,
  },
  { key: 'address', label: 'Address', type: FieldType.Text, required: false },
  { key: 'zip', label: 'ZIP code', type: FieldType.Zip, required: false },
  { key: 'city', label: 'City', type: FieldType.Text, required: false },
  {
    key: 'birth-date',
    label: 'Birth date',
    type: FieldType.Date,
    required: false,
  },
  { key: 'gender', label: 'Gender', type: FieldType.Text, required: false },
] as const;

const CUSTOM_FIELD_TYPES = [
  { value: FieldType.Text, label: 'Text (short)' },
  { value: FieldType.Textarea, label: 'Text (long)' },
  { value: FieldType.Email, label: 'Email' },
  { value: FieldType.Phone, label: 'Phone' },
  { value: FieldType.Numbers, label: 'Number' },
  { value: FieldType.Date, label: 'Date' },
  { value: FieldType.SingleChoice, label: 'Single choice' },
  { value: FieldType.MultiChoice, label: 'Multi choice' },
  { value: FieldType.Checkbox, label: 'Checkbox' },
  { value: FieldType.StaticText, label: 'Static text' },
] as const;

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.Text]: 'Text (short)',
  [FieldType.Textarea]: 'Text (long)',
  [FieldType.Email]: 'Email',
  [FieldType.Phone]: 'Phone',
  [FieldType.Numbers]: 'Number',
  [FieldType.Date]: 'Date',
  [FieldType.SingleChoice]: 'Single choice',
  [FieldType.MultiChoice]: 'Multi choice',
  [FieldType.Checkbox]: 'Checkbox',
  [FieldType.StaticText]: 'Static text',
  [FieldType.DocumentAcknowledgement]: 'Document acknowledgement',
  [FieldType.Name]: 'First name',
  [FieldType.Lastname]: 'Last name',
  [FieldType.Zip]: 'ZIP code',
  [FieldType.Iban]: 'IBAN',
};

interface BlockFormFieldInput {
  id?: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  systemKey?: string;
  lockType?: boolean;
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
  readOnly,
  onPendingChange,
  onCreated,
}: {
  blockId?: string;
  orgUId: string;
  organizationId: string;
  readOnly?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const isEdit = !!blockId;
  const blockQuery = useBlock(blockId ?? '');

  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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
            systemKey: f.systemKey ?? '',
            lockType: f.lockType ?? false,
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
        systemKey: f.systemKey || undefined,
        lockType: f.lockType ?? false,
        options: f.options,
        documentUrl: f.documentUrl || undefined,
        documentLabel: f.documentLabel || undefined,
      })),
    });

    if (result?.serverError) {
      toast.error(result.serverError);
    } else if (result?.data) {
      toast.success(isEdit ? 'Block saved' : 'Block created');
      reset(data);
      if (!isEdit && result.data.blockId) {
        onCreated?.(result.data.blockId);
      }
    } else {
      toast.error('Failed to save block');
    }
  }

  function appendCustomField(type: FieldType) {
    append({
      type,
      label: '',
      description: '',
      placeholder: '',
      required: false,
      systemKey: '',
      lockType: false,
      options: [],
    });
  }

  function appendSystemField(preset: (typeof SYSTEM_PRESETS)[number]) {
    append({
      type: preset.type,
      label: preset.label,
      description: '',
      placeholder: '',
      required: preset.required,
      systemKey: preset.key,
      lockType: true,
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

  const showSaveButton = !readOnly && (isDirty || !isEdit);

  const usedSystemKeys = new Set(
    watchedFields.map((f) => f.systemKey).filter(Boolean),
  );
  const availablePresets = SYSTEM_PRESETS.filter(
    (p) => !usedSystemKeys.has(p.key),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {readOnly && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            This block is locked because it&apos;s used in a form that has
            received submissions.
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-4">
        <Field>
          <FieldLabel>
            Block Title <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Personal Information"
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </Field>

        <Field>
          <FieldLabel>Icon</FieldLabel>
          <Input
            {...register('icon')}
            placeholder="e.g. user"
            disabled={readOnly}
          />
        </Field>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Fields ({fields.length})</h3>

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
            currentRequired={watchedFields[index]?.required ?? false}
            isSystemField={!!watchedFields[index]?.systemKey}
            lockType={watchedFields[index]?.lockType ?? false}
            onToggleRequired={(next) =>
              setValue(`fields.${index}.required`, next, { shouldDirty: true })
            }
            readOnly={readOnly}
          />
        ))}

        {!readOnly && (
          <div className="space-y-2 pt-1">
            <div className="flex gap-4">
              {/* Field type picker */}
              <Popover open={fieldPickerOpen} onOpenChange={setFieldPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Plus className="mr-2 size-4" />
                    Add field
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1" align="start">
                  {CUSTOM_FIELD_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      onClick={() => {
                        appendCustomField(t.value);
                        setFieldPickerOpen(false);
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Profile field picker */}
              <Popover
                open={profilePickerOpen}
                onOpenChange={setProfilePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={availablePresets.length === 0}
                  >
                    <UserCircle2 className="mr-2 size-4" />
                    Add profile field
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="border-b p-3">
                    <p className="text-muted-foreground text-xs">
                      Volunteers fill these in once and they&apos;re reused
                      across organizations.
                    </p>
                  </div>
                  <div className="max-h-72 space-y-1 overflow-y-auto p-2">
                    {availablePresets.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent"
                        onClick={() => {
                          appendSystemField(p);
                          setProfilePickerOpen(false);
                        }}
                      >
                        <UserCircle2 className="text-muted-foreground size-4 shrink-0" />
                        <span className="text-sm font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Document shortcut */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() =>
                  appendCustomField(FieldType.DocumentAcknowledgement)
                }
              >
                <FileText className="mr-2 size-4" />
                Add document
              </Button>
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="sticky bottom-0 -mx-6 border-t bg-background px-6 py-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || !showSaveButton}
          >
            <Save className="mr-2 size-4" />
            {isSubmitting
              ? 'Saving…'
              : isEdit
                ? 'Save changes'
                : 'Create block'}
          </Button>
        </div>
      )}
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
  currentRequired,
  isSystemField,
  lockType,
  onToggleRequired,
  readOnly,
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
  currentRequired: boolean;
  isSystemField: boolean;
  lockType: boolean;
  onToggleRequired: (next: boolean) => void;
  readOnly?: boolean;
}) {
  const showOptions =
    fieldType === FieldType.SingleChoice || fieldType === FieldType.MultiChoice;
  const isDocument = fieldType === FieldType.DocumentAcknowledgement;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Field {index + 1}
          </span>
          {isSystemField && (
            <Badge variant="secondary" className="text-xs">
              <UserCircle2 className="mr-1 size-3" />
              System field
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                checked={currentRequired}
                onCheckedChange={onToggleRequired}
                size="sm"
                disabled={isSystemField}
              />
              {currentRequired ? 'Required' : 'Optional'}
            </label>
          )}
          {!readOnly && (
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel>
            Type <span className="text-destructive">*</span>
          </FieldLabel>
          {lockType && fieldType ? (
            <div className="border-input bg-muted/50 text-muted-foreground flex h-9 w-full items-center rounded-md border px-3 text-sm">
              {FIELD_TYPE_LABELS[fieldType] ?? fieldType}
            </div>
          ) : (
            <Controller
              control={control}
              name={`fields.${index}.type`}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={FieldType.DocumentAcknowledgement}>
                      Document acknowledgement
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )}
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
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </Field>

        <Field>
          <FieldLabel>Placeholder</FieldLabel>
          <Input
            {...register(`fields.${index}.placeholder`)}
            placeholder="e.g. Enter your name"
            disabled={readOnly}
          />
        </Field>

        {isDocument && (
          <>
            <Field className="md:col-span-2">
              <FieldLabel>Document URL</FieldLabel>
              <Input
                {...register(`fields.${index}.documentUrl`)}
                placeholder="https://example.com/document.pdf"
                disabled={readOnly}
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Document Label</FieldLabel>
              <Input
                {...register(`fields.${index}.documentLabel`)}
                placeholder="e.g. Terms of Service"
                disabled={readOnly}
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
                disabled={readOnly}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
