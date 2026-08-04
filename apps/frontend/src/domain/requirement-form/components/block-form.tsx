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
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';
import { FileUpload } from '@/components/storage/file-upload';
import { saveBlock } from '../actions';
import { OptionsEditor } from './options-editor';

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
  documentFileId?: string | null;
  documentDownloadUrl?: string;
  documentFilename?: string;
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
  onSuccess,
}: {
  blockId?: string;
  orgUId: string;
  organizationId: string;
  readOnly?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  onSuccess: (id: string) => void;
}) {
  const t = useTranslations('RequirementForm.block');
  const tField = useTranslations('RequirementForm.fieldForm');
  const tActions = useTranslations('RequirementForm.actions');
  const tValidation = useTranslations('RequirementForm.validation');
  const isEdit = !!blockId;
  const blockQuery = useBlock(blockId ?? '');

  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);

  const systemPresets = [
    {
      key: 'name',
      label: tField('firstName'),
      type: FieldType.Name,
      required: true,
    },
    {
      key: 'lastname',
      label: tField('lastName'),
      type: FieldType.Lastname,
      required: true,
    },
    {
      key: 'preferred-name',
      label: tField('preferredName'),
      type: FieldType.Text,
      required: false,
    },
    {
      key: 'email',
      label: tField('email'),
      type: FieldType.Email,
      required: true,
    },
    {
      key: 'phone',
      label: tField('phone'),
      type: FieldType.Phone,
      required: false,
    },
    {
      key: 'address',
      label: tField('address'),
      type: FieldType.Text,
      required: false,
    },
    {
      key: 'zip',
      label: tField('zipCode'),
      type: FieldType.Zip,
      required: false,
    },
    {
      key: 'city',
      label: tField('city'),
      type: FieldType.Text,
      required: false,
    },
    {
      key: 'birth-date',
      label: tField('birthDate'),
      type: FieldType.Date,
      required: false,
    },
    {
      key: 'gender',
      label: tField('gender'),
      type: FieldType.Text,
      required: false,
    },
  ] as const;

  const customFieldTypes = [
    { value: FieldType.Text, label: tField('shortText') },
    { value: FieldType.Textarea, label: tField('longText') },
    { value: FieldType.Email, label: tField('email') },
    { value: FieldType.Phone, label: tField('phone') },
    { value: FieldType.Numbers, label: tField('number') },
    { value: FieldType.Date, label: tField('date') },
    { value: FieldType.SingleChoice, label: tField('dropdown') },
    { value: FieldType.MultiChoice, label: tField('multiSelect') },
    { value: FieldType.Checkbox, label: tField('checkbox') },
    { value: FieldType.StaticText, label: tField('infoText') },
  ];

  const fieldTypeLabels: Record<FieldType, string> = {
    [FieldType.Text]: tField('shortText'),
    [FieldType.Textarea]: tField('longText'),
    [FieldType.Email]: tField('email'),
    [FieldType.Phone]: tField('phone'),
    [FieldType.Numbers]: tField('number'),
    [FieldType.Date]: tField('date'),
    [FieldType.SingleChoice]: tField('dropdown'),
    [FieldType.MultiChoice]: tField('multiSelect'),
    [FieldType.Checkbox]: tField('checkbox'),
    [FieldType.StaticText]: tField('infoText'),
    [FieldType.DocumentAcknowledgement]: tField('document'),
    [FieldType.Name]: tField('firstName'),
    [FieldType.Lastname]: tField('lastName'),
    [FieldType.Zip]: tField('zipCode'),
    [FieldType.Iban]: 'IBAN',
  };

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
            documentFileId: f.documentFileId ?? null,
            documentDownloadUrl: f.documentDownloadUrl ?? '',
            documentFilename: f.documentFilename ?? '',
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
      toast.error(tActions('failedToLoadBlock'));
    }
  }, [blockQuery.isError, tActions]);

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
        documentFileId: f.documentFileId,
        documentLabel: f.documentLabel || undefined,
      })),
    });

    if (result?.serverError) {
      toast.error(result.serverError);
    } else if (result?.data) {
      toast.success(isEdit ? tActions('blockSaved') : tActions('blockCreated'));
      reset(data);
      onSuccess(result.data.blockId);
    } else {
      toast.error(tActions('failedToSaveBlock'));
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
      ...(type === FieldType.DocumentAcknowledgement
        ? { documentFileId: null, documentLabel: '' }
        : {}),
    });
  }

  function appendSystemField(preset: (typeof systemPresets)[number]) {
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
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      </div>
    );
  }

  const showSaveButton = !readOnly && (isDirty || !isEdit);

  const usedSystemKeys = new Set(
    watchedFields.map((f) => f.systemKey).filter(Boolean),
  );
  const availablePresets = systemPresets.filter(
    (p) => !usedSystemKeys.has(p.key),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {readOnly && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">{t('lockedNotice')}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-4">
        <Field>
          <FieldLabel>
            {t('blockTitleLabel')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register('title', { required: tValidation('titleRequired') })}
            placeholder={t('titlePlaceholder')}
            disabled={readOnly}
          />
          {errors.title && (
            <p className="text-destructive text-sm">{errors.title.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel>{t('descriptionLabel')}</FieldLabel>
          <Textarea
            {...register('description')}
            placeholder={t('descriptionPlaceholder')}
            disabled={readOnly}
          />
        </Field>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {t('fieldsTitle', { count: fields.length })}
        </h3>

        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-muted-foreground text-sm">{t('noFields')}</p>
          </div>
        )}

        {fields.map((field, index) => (
          <FieldCard
            key={field.id}
            index={index}
            orgUId={orgUId}
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
            customFieldTypes={customFieldTypes}
            fieldTypeLabels={fieldTypeLabels}
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
                    {t('addField')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1" align="start">
                  {customFieldTypes.map((t) => (
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
                modal
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
                    {t('addProfileField')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="border-b p-3">
                    <p className="text-muted-foreground text-xs">
                      {t('profileFieldHint')}
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
                {t('addDocument')}
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
              ? t('saving')
              : isEdit
                ? t('saveChanges')
                : t('createBlock')}
          </Button>
        </div>
      )}
    </form>
  );
}

function FieldCard({
  index,
  orgUId,
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
  customFieldTypes,
  fieldTypeLabels,
}: {
  index: number;
  orgUId: string;
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
  customFieldTypes: { value: FieldType; label: string }[];
  fieldTypeLabels: Record<FieldType, string>;
}) {
  const t = useTranslations('RequirementForm.block');
  const tField = useTranslations('RequirementForm.fieldForm');
  const tValidation = useTranslations('RequirementForm.validation');
  const showOptions =
    fieldType === FieldType.SingleChoice || fieldType === FieldType.MultiChoice;
  const isDocument = fieldType === FieldType.DocumentAcknowledgement;
  const documentPreviewUrl = useWatch({
    control,
    name: `fields.${index}.documentDownloadUrl`,
  });
  const documentFilename = useWatch({
    control,
    name: `fields.${index}.documentFilename`,
  });

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t('fieldN', { n: index + 1 })}
          </span>
          {isSystemField && (
            <Badge variant="secondary" className="text-xs">
              <UserCircle2 className="mr-1 size-3" />
              {t('systemField')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <label
              htmlFor={`field-${index}-required`}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Switch
                id={`field-${index}-required`}
                checked={currentRequired}
                onCheckedChange={onToggleRequired}
                size="sm"
                disabled={isSystemField}
              />
              {currentRequired ? t('required') : t('optional')}
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
            {tField('fieldTypeLabel')}{' '}
            <span className="text-destructive">*</span>
          </FieldLabel>
          {lockType && fieldType ? (
            <div className="border-input bg-muted/50 text-muted-foreground flex h-9 w-full items-center rounded-md border px-3 text-sm">
              {fieldTypeLabels[fieldType] ?? fieldType}
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
                    <SelectValue placeholder={tField('fieldTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customFieldTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={FieldType.DocumentAcknowledgement}>
                      {tField('document')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>

        <Field>
          <FieldLabel>
            {tField('labelLabel')} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register(`fields.${index}.label`, {
              required: tValidation('labelRequired'),
            })}
            placeholder={tField('labelPlaceholder')}
            disabled={readOnly}
          />
          {errors?.label && (
            <p className="text-destructive text-sm">{errors.label.message}</p>
          )}
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>{tField('descriptionLabel')}</FieldLabel>
          <Input
            {...register(`fields.${index}.description`)}
            placeholder={tField('descriptionPlaceholder')}
            disabled={readOnly}
          />
        </Field>

        <Field>
          <FieldLabel>{tField('placeholderLabel')}</FieldLabel>
          <Input
            {...register(`fields.${index}.placeholder`)}
            placeholder={tField('placeholderPlaceholder')}
            disabled={readOnly}
          />
        </Field>

        {isDocument && (
          <>
            <Field className="md:col-span-2">
              <Controller
                control={control}
                name={`fields.${index}.documentFileId`}
                rules={{ required: tField('enterDocumentFileError') }}
                render={({ field, fieldState }) => (
                  <FileUpload
                    purpose="form_document"
                    organizationUnitId={orgUId}
                    label={tField('documentFileLabel')}
                    value={field.value || null}
                    initialPreviewUrl={documentPreviewUrl || null}
                    initialFilename={documentFilename || null}
                    disabled={readOnly}
                    error={fieldState.error?.message}
                    onUploaded={(result) => field.onChange(result.fileId)}
                    onClear={() => field.onChange(null)}
                  />
                )}
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>
                {tField('documentLabelLabel')}{' '}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...register(`fields.${index}.documentLabel`, {
                  required: tField('enterDocumentLabelError'),
                })}
                placeholder={tField('documentLabelPlaceholder')}
                disabled={readOnly}
              />
              {errors?.documentLabel && (
                <p className="text-destructive text-sm">
                  {errors.documentLabel.message}
                </p>
              )}
            </Field>
          </>
        )}
      </div>

      {showOptions && (
        <div className="md:col-span-2">
          <FieldLabel>{tField('optionsLabel')}</FieldLabel>
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
