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
import { useState } from 'react';
import { OptionsEditor } from './options-editor';

const FIELD_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Short Text', value: 'TEXT' },
  { label: 'Long Text', value: 'TEXTAREA' },
  { label: 'Number', value: 'NUMBERS' },
  { label: 'Date', value: 'DATE' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Phone', value: 'PHONE' },
  { label: 'Dropdown', value: 'SINGLE_CHOICE' },
  { label: 'Multi Select', value: 'MULTI_CHOICE' },
  { label: 'Checkbox', value: 'CHECKBOX' },
  { label: 'Document', value: 'DOCUMENT_ACKNOWLEDGEMENT' },
  { label: 'Info Text', value: 'STATIC_TEXT' },
];

// Field types that have a fixed, unambiguous system key
const AUTO_SYSTEM_KEY: Record<string, string> = {
  EMAIL: 'email',
  PHONE: 'phone',
};

// System keys that can be manually assigned to text-like fields
const TEXT_SYSTEM_KEY_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'First name', value: 'name' },
  { label: 'Last name', value: 'lastname' },
  { label: 'Preferred name', value: 'preferred-name' },
  { label: 'Gender', value: 'gender' },
  { label: 'Address', value: 'address' },
  { label: 'ZIP code', value: 'zip' },
  { label: 'City', value: 'city' },
  { label: 'Birth date', value: 'birth-date' },
];

const TEXT_LIKE_TYPES = new Set(['TEXT', 'TEXTAREA', 'DATE', 'NUMBERS']);

export function FieldForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: FormBlockField;
  onSubmit: (data: {
    type: string;
    label: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    systemKey?: string;
    options?: { label: string; value: string }[];
    documentUrl?: string;
    documentLabel?: string;
  }) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const isLocked = initial?.lockType ?? false;

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
  const [documentUrl, setDocumentUrl] = useState(initial?.documentUrl ?? '');
  const [error, setError] = useState<string | null>(null);

  const showOptions =
    fieldType === 'SINGLE_CHOICE' || fieldType === 'MULTI_CHOICE';
  const isDocument = fieldType === 'DOCUMENT_ACKNOWLEDGEMENT';
  const isStaticText = fieldType === 'STATIC_TEXT';
  const autoSystemKey = AUTO_SYSTEM_KEY[fieldType];
  const showSystemKeyPicker = !autoSystemKey && TEXT_LIKE_TYPES.has(fieldType);

  function commit() {
    if (!fieldType) {
      setError('Please select a field type.');
      return;
    }
    if (!label.trim()) {
      setError(isStaticText ? 'Please enter text.' : 'Please enter a label.');
      return;
    }
    if (isDocument && !documentUrl.trim()) {
      setError('Please enter a document URL.');
      return;
    }
    if (showOptions && !options.some((o) => o.label.trim() !== '')) {
      setError('Please enter at least one option.');
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
            documentUrl: documentUrl.trim(),
            documentLabel: `${label.trim()} read`,
          }
        : {}),
    });
  }

  const canSubmit =
    !!fieldType &&
    label.trim() !== '' &&
    (!isDocument || documentUrl.trim() !== '') &&
    (!showOptions || options.some((o) => o.label.trim() !== ''));

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {!isLocked && (
        <Field>
          <FieldLabel>Field Type</FieldLabel>
          <Select value={fieldType} onValueChange={(v) => setFieldType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPE_OPTIONS.map((opt) => (
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
            <FieldLabel>{isStaticText ? 'Text' : 'Label'}</FieldLabel>
            {isStaticText ? (
              <Textarea
                placeholder="e.g. Please read the following information"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (error) setError(null);
                }}
                rows={3}
              />
            ) : (
              <Input
                placeholder="e.g. Favorite color"
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
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="Optional help text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Placeholder</FieldLabel>
                <Input
                  placeholder="e.g. Enter your answer"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </Field>
            </>
          )}

          {autoSystemKey && (
            <p className="text-muted-foreground text-xs">
              Profile field: <strong>{autoSystemKey}</strong> — value will be
              saved to the user&apos;s profile for pre-fill on future forms.
            </p>
          )}

          {showSystemKeyPicker && (
            <Field>
              <FieldLabel>Profile field (optional)</FieldLabel>
              <Select
                value={manualSystemKey}
                onValueChange={setManualSystemKey}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_SYSTEM_KEY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || '__none'} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {isDocument && (
            <Field>
              <FieldLabel>Document URL</FieldLabel>
              <Input
                placeholder="https://example.com/document.pdf"
                value={documentUrl}
                onChange={(e) => {
                  setDocumentUrl(e.target.value);
                  if (error) setError(null);
                }}
              />
            </Field>
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
                Required
              </FieldLabel>
            </div>
          )}
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={commit} disabled={!canSubmit}>
          {isEdit ? 'Save' : 'Add'}
        </Button>
      </div>
    </div>
  );
}
