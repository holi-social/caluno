'use client';

import type { FormBlockField } from '@repo/data';
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
  Switch,
  Textarea,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FileUpload } from '@/domain/storage/components/file-upload';
import { OptionsEditor } from './options-editor';

// Field types that have a fixed, unambiguous system key
const AUTO_SYSTEM_KEY: Record<string, string> = {
  EMAIL: 'email',
  PHONE: 'phone',
};

const TEXT_LIKE_TYPES = new Set(['TEXT', 'TEXTAREA', 'DATE', 'NUMBERS']);

export function FieldForm({
  initial,
  orgUId,
  onSubmit,
  onCancel,
}: {
  initial?: FormBlockField;
  orgUId: string;
  onSubmit: (data: {
    type: string;
    label: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    systemKey?: string;
    options?: { label: string; value: string }[];
    documentFileId?: string | null;
    documentLabel?: string;
  }) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('RequirementForm.fieldForm');
  const tCommon = useTranslations('Common');
  const isEdit = !!initial;
  const isLocked = initial?.lockType ?? false;

  const fieldTypeOptions: { label: string; value: string }[] = [
    { label: t('shortText'), value: 'TEXT' },
    { label: t('longText'), value: 'TEXTAREA' },
    { label: t('number'), value: 'NUMBERS' },
    { label: t('date'), value: 'DATE' },
    { label: t('email'), value: 'EMAIL' },
    { label: t('phone'), value: 'PHONE' },
    { label: t('dropdown'), value: 'SINGLE_CHOICE' },
    { label: t('multiSelect'), value: 'MULTI_CHOICE' },
    { label: t('checkbox'), value: 'CHECKBOX' },
    { label: t('document'), value: 'DOCUMENT_ACKNOWLEDGEMENT' },
    { label: t('infoText'), value: 'STATIC_TEXT' },
  ];

  const textSystemKeyOptions = [
    { label: t('profileFieldNone'), value: '' },
    { label: t('firstName'), value: 'name' },
    { label: t('lastName'), value: 'lastname' },
    { label: t('preferredName'), value: 'preferred-name' },
    { label: t('gender'), value: 'gender' },
    { label: t('address'), value: 'address' },
    { label: t('zipCode'), value: 'zip' },
    { label: t('city'), value: 'city' },
    { label: t('birthDate'), value: 'birth-date' },
  ];

  const [fieldType, setFieldType] = useState(initial?.type ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? '');
  const [required, setRequired] = useState(initial?.required ?? true);
  const [manualSystemKey, setManualSystemKey] = useState(
    initial?.systemKey && !AUTO_SYSTEM_KEY[initial.type]
      ? initial.systemKey
      : '',
  );
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    () => {
      if (initial?.options && initial.options.length > 0) {
        return initial.options.map((o) => ({ label: o.label, value: o.value }));
      }
      return [
        { label: '', value: '' },
        { label: '', value: '' },
        { label: '', value: '' },
      ];
    },
  );
  const [documentFileId, setDocumentFileId] = useState<string | null>(
    initial?.documentFileId ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const showOptions =
    fieldType === 'SINGLE_CHOICE' || fieldType === 'MULTI_CHOICE';
  const isDocument = fieldType === 'DOCUMENT_ACKNOWLEDGEMENT';
  const isStaticText = fieldType === 'STATIC_TEXT';
  const autoSystemKey = AUTO_SYSTEM_KEY[fieldType];
  const showSystemKeyPicker = !autoSystemKey && TEXT_LIKE_TYPES.has(fieldType);

  function commit() {
    if (!fieldType) {
      setError(t('selectTypeError'));
      return;
    }
    if (!label.trim()) {
      setError(isStaticText ? t('enterTextError') : t('enterLabelError'));
      return;
    }
    if (isDocument && !documentFileId) {
      setError(t('enterDocumentFileError'));
      return;
    }
    if (showOptions && !options.some((o) => o.label.trim() !== '')) {
      setError(t('enterOptionError'));
      return;
    }

    const systemKey = autoSystemKey || manualSystemKey || undefined;

    setError(null);
    onSubmit({
      type: fieldType,
      label: label.trim(),
      description: description.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      required: isStaticText ? false : required,
      systemKey,
      ...(showOptions
        ? {
            options: options
              .filter((o) => o.label.trim() !== '')
              .map((o) => ({
                label: o.label.trim(),
                value:
                  o.value.trim() ||
                  o.label.trim().toLowerCase().replace(/\s+/g, '-'),
              })),
          }
        : {}),
      ...(isDocument
        ? {
            documentFileId,
            documentLabel: `${label.trim()} read`,
          }
        : {}),
    });
  }

  const canSubmit =
    !!fieldType &&
    label.trim() !== '' &&
    (!isDocument || Boolean(documentFileId)) &&
    (!showOptions || options.some((o) => o.label.trim() !== ''));

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {!isLocked && (
        <Field>
          <FieldLabel>{t('fieldTypeLabel')}</FieldLabel>
          <Select value={fieldType} onValueChange={(v) => setFieldType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('fieldTypePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {fieldTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {fieldType && (
        <>
          <Field>
            <FieldLabel>
              {isStaticText ? t('textLabel') : t('labelLabel')}
            </FieldLabel>
            {isStaticText ? (
              <Textarea
                placeholder={t('textPlaceholder')}
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (error) setError(null);
                }}
                rows={3}
              />
            ) : (
              <Input
                placeholder={t('labelPlaceholder')}
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (error) setError(null);
                }}
              />
            )}
          </Field>

          {!isDocument && !isStaticText && (
            <>
              <Field>
                <FieldLabel>{t('descriptionLabel')}</FieldLabel>
                <Input
                  placeholder={t('descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>{t('placeholderLabel')}</FieldLabel>
                <Input
                  placeholder={t('placeholderPlaceholder')}
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </Field>
            </>
          )}

          {autoSystemKey && (
            <p className="text-muted-foreground text-xs">
              {t('profileField', { key: autoSystemKey })}
            </p>
          )}

          {showSystemKeyPicker && (
            <Field>
              <FieldLabel>{t('profileFieldOptional')}</FieldLabel>
              <Select
                value={manualSystemKey}
                onValueChange={setManualSystemKey}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('profileFieldNone')} />
                </SelectTrigger>
                <SelectContent>
                  {textSystemKeyOptions.map((opt) => (
                    <SelectItem key={opt.value || '__none'} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {isDocument && (
            <FileUpload
              purpose="form_document"
              organizationUnitId={orgUId}
              label={t('documentFileLabel')}
              value={documentFileId || null}
              initialPreviewUrl={initial?.documentDownloadUrl}
              initialFilename={initial?.documentFilename}
              error={error ?? undefined}
              onUploaded={(result) => {
                setDocumentFileId(result.fileId);
                if (error) setError(null);
              }}
              onClear={() => {
                setDocumentFileId(null);
                if (error) setError(null);
              }}
            />
          )}

          {showOptions && (
            <OptionsEditor options={options} onChange={setOptions} />
          )}

          {!isStaticText && (
            <div className="flex items-center gap-3">
              <Switch
                id="field-required"
                checked={required}
                onCheckedChange={setRequired}
              />
              <FieldLabel htmlFor="field-required" className="mb-0">
                {t('required')}
              </FieldLabel>
            </div>
          )}
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
        <Button onClick={commit} disabled={!canSubmit}>
          {isEdit ? t('save') : t('add')}
        </Button>
      </div>
    </div>
  );
}
