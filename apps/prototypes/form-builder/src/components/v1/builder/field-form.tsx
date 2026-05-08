'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
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
} from '@repo/ui';
import type { FieldType, FormField } from '@/lib/types';
import { FIELD_TYPE_OPTIONS } from '@/lib/predefined-fields';
import type { UploadedFile } from '@/lib/use-file-upload';
import { FileUploadField } from './file-upload-field';
import { OptionsEditor } from './options-editor';

export type FieldCommitHandle = { commit: () => boolean };

export const FieldForm = forwardRef<
  FieldCommitHandle,
  {
    initial?: FormField;
    onSubmit: (field: FormField) => void;
    onCancel: () => void;
  }
>(function FieldForm({ initial, onSubmit, onCancel }, ref) {
  const isEdit = !!initial;
  const idScope = initial?.id ?? 'new';

  const [fieldType, setFieldType] = useState<FieldType | ''>(
    initial?.type ?? '',
  );
  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [options, setOptions] = useState<string[]>(() => {
    const initialOptions = initial?.options;
    if (initialOptions && initialOptions.length > 0) {
      return initialOptions.map((o) => o.label);
    }
    return ['', '', ''];
  });
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(() => {
    if (initial?.type === 'document-acknowledgement' && initial.documentUrl) {
      const filename = initial.documentUrl.split('/').pop() ?? 'Dokument';
      return { url: initial.documentUrl, filename };
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const isDocument = fieldType === 'document-acknowledgement';
  const showOptions =
    fieldType === 'multichoice' || fieldType === 'singlechoice';

  function commit(): boolean {
    if (!fieldType) {
      setError('Bitte Feldtyp auswählen.');
      return false;
    }
    if (!label.trim()) {
      setError('Bitte Feldname eingeben.');
      return false;
    }
    if (isDocument && !uploadedFile) {
      setError('Bitte ein Dokument hochladen.');
      return false;
    }
    if (showOptions && !options.some((o) => o.trim() !== '')) {
      setError('Bitte mindestens eine Option angeben.');
      return false;
    }

    setError(null);
    const id = initial?.id ?? `field-${Date.now()}`;

    if (isDocument && uploadedFile) {
      onSubmit({
        id,
        type: 'document-acknowledgement',
        label: label.trim(),
        documentUrl: uploadedFile.url,
        documentLabel: initial?.documentLabel ?? `${label.trim()} lesen`,
        required: initial?.required ?? true,
      });
      return true;
    }

    const field: FormField = {
      id,
      type: fieldType,
      label: label.trim(),
      required: initial?.required ?? true,
    };
    if (description.trim()) {
      field.description = description.trim();
    }
    if (showOptions) {
      field.options = options
        .filter((o) => o.trim() !== '')
        .map((o) => ({
          label: o.trim(),
          value: o.trim().toLowerCase().replace(/\s+/g, '-'),
        }));
    }
    onSubmit(field);
    return true;
  }

  useImperativeHandle(ref, () => ({ commit }));

  const canSubmit =
    !!fieldType &&
    label.trim() !== '' &&
    (!isDocument || !!uploadedFile) &&
    (!showOptions || options.some((o) => o.trim() !== ''));

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <p className="text-sm font-semibold">
        {isEdit ? 'Feld bearbeiten' : 'Neues Feld'}
      </p>

      <Field>
        <FieldLabel htmlFor={`field-${idScope}-type`}>Feldtyp</FieldLabel>
        <Select
          value={fieldType}
          onValueChange={(v) => setFieldType(v as FieldType)}
        >
          <SelectTrigger
            id={`field-${idScope}-type`}
            size="default"
            className="w-full"
          >
            <SelectValue placeholder="Typ auswählen..." />
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

      {fieldType && (
        <Field>
          <FieldLabel htmlFor={`field-${idScope}-name`}>Feldname</FieldLabel>
          <Input
            id={`field-${idScope}-name`}
            placeholder={
              isDocument ? 'z.B. Datenschutzerklärung' : 'z.B. Lieblingsfarbe'
            }
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (error) setError(null);
            }}
            className="h-10"
          />
        </Field>
      )}

      {fieldType && !isDocument && (
        <Field>
          <FieldLabel htmlFor={`field-${idScope}-desc`}>
            Beschreibung
          </FieldLabel>
          <Input
            id={`field-${idScope}-desc`}
            placeholder="Optionale Hilfestellung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-10"
          />
        </Field>
      )}

      {isDocument && (
        <Field>
          <FieldLabel>Dokument hochladen</FieldLabel>
          <FileUploadField value={uploadedFile} onChange={setUploadedFile} />
        </Field>
      )}

      {showOptions && (
        <OptionsEditor value={options} onChange={setOptions} minRows={2} />
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={() => commit()} disabled={!canSubmit}>
          {isEdit ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>
    </div>
  );
});
