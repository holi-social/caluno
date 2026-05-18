'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AlertDescription,
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
import { UserCircle2 } from 'lucide-react';
import type { FieldType, FormField } from '@/lib/types';
import { FIELD_TYPE_OPTIONS } from '@/lib/predefined-fields';
import {
  SYSTEM_REQUIREMENTS,
  type SystemRequirementKey,
} from '@/lib/system-requirements';
import type { UploadedFile } from '@/lib/use-file-upload';
import { FileUploadField } from './file-upload-field';
import { OptionsEditor } from './options-editor';

export type FieldCommitHandle = {
  commit: () => boolean;
  /** Scroll the form into view and surface its current error inline.
   *  Called by the global Save handler when commit() returns false so
   *  the user lands on the offending field instead of hunting for it. */
  scrollToError: () => void;
};

/** Turn a filename like "Datenschutzerklärung_v3.pdf" into a friendly
 *  default label ("Datenschutzerklärung v3"). Used after document upload
 *  to seed the Feldname input. */
function deriveLabelFromFilename(filename: string): string {
  const noExt = filename.replace(/\.[^/.]+$/, '');
  const spaced = noExt.replace(/[_-]+/g, ' ').trim();
  if (!spaced) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const FieldForm = forwardRef<
  FieldCommitHandle,
  {
    initial?: FormField;
    /** Pre-set the field type for a brand-new field and hide the type picker.
     *  Used by the "Dokument hinzufügen" affordance, where the type is fixed
     *  before the user enters the editor. */
    lockedType?: FieldType;
    onSubmit: (field: FormField) => void;
    onCancel: () => void;
  }
>(function FieldForm({ initial, lockedType, onSubmit, onCancel }, ref) {
  const isEdit = !!initial;
  const idScope = initial?.id ?? 'new';

  const [fieldType, setFieldType] = useState<FieldType | ''>(
    initial?.type ?? lockedType ?? '',
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  function handleUploadedFile(next: UploadedFile | null) {
    setUploadedFile(next);
    // If the user hasn't named the field yet, derive a sensible default
    // from the filename ("Datenschutzerklaerung.pdf" → "Datenschutzerklaerung")
    // and drop them into the Feldname input with the value pre-selected so
    // they can either keep it or replace it with one keystroke.
    if (next && !label.trim()) {
      const derived = deriveLabelFromFilename(next.filename);
      if (derived) {
        setLabel(derived);
        // Defer focus until after React flushes the new value into the input.
        window.setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputRef.current?.select();
        }, 0);
      }
    }
  }
  const [error, setError] = useState<string | null>(null);

  const isDocument = fieldType === 'document-acknowledgement';
  const isStaticText = fieldType === 'static-text';
  const showOptions =
    !initial?.lockType &&
    (fieldType === 'multichoice' || fieldType === 'singlechoice');

  // Tracks an already-committed submission so accidental double-fires
  // (blur firing then a global Save click within the same tick) don't
  // call onSubmit twice.
  const committedRef = useRef(false);
  // Set by Abbrechen's onMouseDown so the blur-commit handler can step
  // aside — explicit cancel always wins over implicit save.
  const cancellingRef = useRef(false);

  function commit(): boolean {
    if (committedRef.current) return true;
    if (!fieldType) {
      setError('Bitte Feldtyp auswählen.');
      return false;
    }
    if (!label.trim()) {
      setError(isStaticText ? 'Bitte Text eingeben.' : 'Bitte Feldname eingeben.');
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
      committedRef.current = true;
      onSubmit({
        id,
        type: 'document-acknowledgement',
        label: label.trim(),
        documentUrl: uploadedFile.url,
        documentLabel: initial?.documentLabel ?? `${label.trim()} lesen`,
        required: initial?.required ?? true,
        ...(initial?.lockType ? { lockType: initial.lockType } : {}),
        ...(initial?.systemKey ? { systemKey: initial.systemKey } : {}),
      });
      return true;
    }

    const field: FormField = {
      id,
      type: fieldType,
      label: label.trim(),
      required: isStaticText ? false : (initial?.required ?? true),
      ...(initial?.lockType ? { lockType: initial.lockType } : {}),
      ...(initial?.systemKey ? { systemKey: initial.systemKey } : {}),
      ...(initial?.minAge !== undefined ? { minAge: initial.minAge } : {}),
      ...(initial?.options ? { options: initial.options } : {}),
    };
    if (!isStaticText && description.trim()) {
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
    committedRef.current = true;
    onSubmit(field);
    return true;
  }

  const rootRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    commit,
    scrollToError: () => {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  const canSubmit =
    !!fieldType &&
    label.trim() !== '' &&
    (!isDocument || !!uploadedFile) &&
    (!showOptions || options.some((o) => o.trim() !== ''));

  const isLocked = !!initial?.lockType;
  // Type is only chosen at creation. Editing an existing field keeps the
  // original type — changing it would invalidate the stored value shape and
  // any per-type extras (options, document upload, etc.).
  const hideTypePicker = isLocked || !!lockedType || isEdit;
  // For a brand-new custom field, open the type picker immediately so the
  // first interaction is "pick a type" with no preliminary click.
  const autoOpenTypeSelect = !hideTypePicker && !fieldType;

  // After the user picks a type, move focus to the next required input.
  // Document fields have their own Part-1 focus flow (post-upload prefill),
  // and static-text uses a Textarea which we deliberately don't auto-grab —
  // the user just picked the type and tends to glance at it before typing.
  useEffect(() => {
    if (!fieldType) return;
    if (isDocument || isStaticText) return;
    nameInputRef.current?.focus();
    // biome-ignore lint/correctness/useExhaustiveDependencies: chain runs once per type change
  }, [fieldType]);

  function handleRootBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Focus moved to another element inside this form — not a real exit.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    // Explicit Abbrechen wins; the cancel button itself handles teardown.
    if (cancellingRef.current) {
      cancellingRef.current = false;
      return;
    }
    // Nothing entered yet — treat as a no-op so an empty add doesn't error.
    if (!fieldType && !label.trim() && !uploadedFile) return;
    commit();
  }
  const systemPreset =
    initial?.systemKey && initial.systemKey in SYSTEM_REQUIREMENTS
      ? SYSTEM_REQUIREMENTS[initial.systemKey as SystemRequirementKey]
      : null;

  return (
    <div
      ref={rootRef}
      onBlur={handleRootBlur}
      className="border-primary space-y-4 rounded-lg border p-4"
    >

      {!hideTypePicker && (
        <Field>
          <FieldLabel htmlFor={`field-${idScope}-type`}>Feldtyp</FieldLabel>
          <Select
            value={fieldType}
            defaultOpen={autoOpenTypeSelect}
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
      )}

      {fieldType && (
        <Field>
          <FieldLabel htmlFor={`field-${idScope}-name`}>
            {isStaticText ? 'Text' : 'Feldname'}
          </FieldLabel>
          {isStaticText ? (
            <Textarea
              id={`field-${idScope}-name`}
              placeholder="z.B. Hinweis zu diesem Abschnitt"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError(null);
              }}
              rows={3}
            />
          ) : (
            <Input
              ref={nameInputRef}
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
          )}
        </Field>
      )}

      {fieldType && !isDocument && !isStaticText && (
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
          <FileUploadField
            value={uploadedFile}
            onChange={handleUploadedFile}
          />
        </Field>
      )}

      {showOptions && (
        <OptionsEditor value={options} onChange={setOptions} minRows={2} />
      )}

      {isLocked && systemPreset && (
        <Alert>
          <UserCircle2 />
          <AlertDescription>
            <p>
              Antwort wird als <strong>{systemPreset.defaultLabel}</strong> im
              Profil der freiwilligen Person gespeichert und in anderen Formularen 
              wiederverwendet.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onMouseDown={() => {
            cancellingRef.current = true;
          }}
          onClick={onCancel}
        >
          Abbrechen
        </Button>
        <Button onClick={() => commit()} disabled={!canSubmit}>
          {isEdit ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>
    </div>
  );
});
