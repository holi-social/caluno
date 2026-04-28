'use client';

import { useState, useRef } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@repo/ui';
import { Plus, Upload, X } from 'lucide-react';
import type { FieldType, FormField, SelectOption } from '@/lib/types';
import {
  type PredefinedFieldKey,
  PREDEFINED_FIELD_OPTIONS,
  getPredefinedField,
} from '@/lib/predefined-fields';

type SelectedKey = PredefinedFieldKey | 'document' | 'custom' | '';

type CustomFieldType = 'text' | 'numbers' | 'multichoice' | 'singlechoice' | 'date';

const FIELD_PICKER_OPTIONS: { key: SelectedKey; label: string }[] = [
  ...PREDEFINED_FIELD_OPTIONS.map((o) => ({ key: o.key as SelectedKey, label: o.label })),
  { key: 'document', label: 'Dokument zum Akzeptieren' },
  { key: 'custom', label: 'Benutzerdefiniert' },
];

const CUSTOM_TYPE_OPTIONS: { label: string; value: CustomFieldType }[] = [
  { label: 'Eingabe', value: 'text' },
  { label: 'Zahlen', value: 'numbers' },
  { label: 'Mehrfachauswahl', value: 'multichoice' },
  { label: 'Einzelauswahl', value: 'singlechoice' },
  { label: 'Datum', value: 'date' },
];

export function AddFieldDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (field: FormField) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<SelectedKey>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<CustomFieldType>('text');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; filename: string } | null>(null);
  const [documentLabel, setDocumentLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setSelectedKey('');
    setCustomTitle('');
    setCustomType('text');
    setRequired(false);
    setOptions(['', '', '']);
    setUploadedFile(null);
    setDocumentLabel('');
  }

  function handleAdd() {
    const id = `field-${Date.now()}`;

    if (selectedKey === 'document') {
      if (!uploadedFile || !documentLabel.trim()) return;
      onAdd({
        id,
        type: 'document-acknowledgement',
        label: documentLabel.trim(),
        documentUrl: uploadedFile.url,
        documentLabel: `${documentLabel.trim()} lesen`,
        required: true,
      });
      reset();
      onOpenChange(false);
      return;
    }

    if (selectedKey === 'custom') {
      if (!customTitle.trim()) return;
      const fieldType: FieldType = customType;
      const field: FormField = {
        id,
        type: fieldType,
        label: customTitle.trim(),
        required,
      };
      if (customType === 'multichoice' || customType === 'singlechoice') {
        field.options = options
          .filter((o) => o.trim() !== '')
          .map((o) => ({ label: o.trim(), value: o.trim().toLowerCase().replace(/\s+/g, '-') }));
      }
      onAdd(field);
      reset();
      onOpenChange(false);
      return;
    }

    if (selectedKey) {
      const predefined = getPredefinedField(selectedKey);
      onAdd({ id, ...predefined });
      reset();
      onOpenChange(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadedFile({ url: data.url, filename: data.filename });
      }
    } finally {
      setUploading(false);
    }
  }

  function handleOptionChange(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, '']);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  const showCustomFields = selectedKey === 'custom';
  const showOptions = showCustomFields && (customType === 'multichoice' || customType === 'singlechoice');
  const showDocument = selectedKey === 'document';

  const canAdd =
    selectedKey === 'document'
      ? !!uploadedFile && documentLabel.trim() !== ''
      : selectedKey === 'custom'
        ? customTitle.trim() !== '' && (!showOptions || options.some((o) => o.trim() !== ''))
        : selectedKey !== '';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Neues Feld hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Step 1: Pick predefined or custom */}
          <Field>
            <FieldLabel htmlFor="field-preset">Feldtyp</FieldLabel>
            <Select value={selectedKey} onValueChange={(v) => { setSelectedKey(v as SelectedKey); }}>
              <SelectTrigger id="field-preset" size="default" className="w-full">
                <SelectValue placeholder="Feld auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {FIELD_PICKER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Predefined field preview */}
          {selectedKey && !showCustomFields && !showDocument && (() => {
            const pf = getPredefinedField(selectedKey as PredefinedFieldKey);
            return (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Titel:</span> {pf.label}</p>
                  <p><span className="font-medium">Typ:</span> {pf.type}</p>
                  {pf.required && <p className="text-muted-foreground">Pflichtfeld</p>}
                </div>
              </div>
            );
          })()}

          {/* Document upload */}
          {showDocument && (
            <>
              <Separator />
              <Field>
                <FieldLabel htmlFor="doc-label">Dokumentname</FieldLabel>
                <Input
                  id="doc-label"
                  placeholder="z.B. Datenschutzerklärung"
                  value={documentLabel}
                  onChange={(e) => setDocumentLabel(e.target.value)}
                  className="h-11 text-base"
                />
              </Field>
              <Field>
                <FieldLabel>Dokument hochladen</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
                    <span className="flex-1 truncate">{uploadedFile.filename}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="lg"
                  >
                    <Upload className="mr-2 size-4" />
                    {uploading ? 'Hochladen...' : 'Datei auswählen'}
                  </Button>
                )}
              </Field>
            </>
          )}

          {/* Custom field config */}
          {showCustomFields && (
            <>
              <Separator />
              <Field>
                <FieldLabel htmlFor="custom-title">Feldname</FieldLabel>
                <Input
                  id="custom-title"
                  placeholder="z.B. Lieblingsfarbe"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-11 text-base"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-type">Typ</FieldLabel>
                <Select value={customType} onValueChange={(v) => setCustomType(v as CustomFieldType)}>
                  <SelectTrigger id="custom-type" size="default" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="custom-required"
                  checked={required}
                  onCheckedChange={(val) => setRequired(val === true)}
                />
                <label htmlFor="custom-required" className="text-sm font-medium cursor-pointer">
                  Pflichtfeld
                </label>
              </div>

              {/* Options editor for multichoice / singlechoice */}
              {showOptions && (
                <div className="space-y-2">
                  <Separator />
                  <FieldLabel>Optionen</FieldLabel>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() => removeOption(i)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="lg" onClick={addOption}>
                    <Plus className="mr-2 size-4" />
                    Option hinzufügen
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button size="lg" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Abbrechen
            </Button>
            <Button size="lg" onClick={handleAdd} disabled={!canAdd}>
              Hinzufügen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
