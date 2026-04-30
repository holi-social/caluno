'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  Switch,
} from '@repo/ui';
import {
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Block, FieldType, FormField, SelectOption } from '@/lib/types';
import { FIELD_TYPE_LABELS } from '@/lib/predefined-fields';

// --- Icon options ---

const ICON_OPTIONS = [
  { label: 'Kein Icon', value: 'none' },
  { label: 'Person', value: 'User' },
  { label: 'Adresse', value: 'MapPin' },
  { label: 'Dokument', value: 'FileCheck' },
  { label: 'Finanzen', value: 'Banknote' },
];

// --- Custom field type options ---

type CustomFieldType =
  | 'text'
  | 'numbers'
  | 'multichoice'
  | 'singlechoice'
  | 'date';

const CUSTOM_TYPE_OPTIONS: { label: string; value: CustomFieldType }[] = [
  { label: 'Eingabe', value: 'text' },
  { label: 'Zahlen', value: 'numbers' },
  { label: 'Mehrfachauswahl', value: 'multichoice' },
  { label: 'Einzelauswahl', value: 'singlechoice' },
  { label: 'Datum', value: 'date' },
];

type SelectedKey = 'document' | 'custom' | '';

const FIELD_PICKER_OPTIONS: { key: SelectedKey; label: string }[] = [
  { key: 'document', label: 'Dokument zum Akzeptieren' },
  { key: 'custom', label: 'Benutzerdefiniert' },
];

// --- Inline field editor ---

function InlineFieldEditor({
  field,
  onSave,
  onCancel,
}: {
  field: FormField;
  onSave: (updates: Partial<FormField>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(field.label);
  const [description, setDescription] = useState(field.description ?? '');

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Field>
        <FieldLabel htmlFor={`edit-${field.id}-label`}>Feldname</FieldLabel>
        <Input
          id={`edit-${field.id}-label`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-10"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`edit-${field.id}-desc`}>Beschreibung</FieldLabel>
        <Input
          id={`edit-${field.id}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optionale Hilfestellung"
          className="h-10"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          size="sm"
          disabled={!label.trim()}
          onClick={() =>
            onSave({
              label: label.trim(),
              description: description.trim() || undefined,
            })
          }
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

// --- Add field inline form ---

function AddFieldInline({
  onAdd,
  onCancel,
}: {
  onAdd: (field: FormField) => void;
  onCancel: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState<SelectedKey>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<CustomFieldType>('text');
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const [documentLabel, setDocumentLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      return;
    }

    if (selectedKey === 'custom') {
      if (!customTitle.trim()) return;
      const fieldType: FieldType = customType;
      const field: FormField = {
        id,
        type: fieldType,
        label: customTitle.trim(),
        required: true,
      };
      if (customType === 'multichoice' || customType === 'singlechoice') {
        field.options = options
          .filter((o) => o.trim() !== '')
          .map((o) => ({
            label: o.trim(),
            value: o
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-'),
          }));
      }
      onAdd(field);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedFile({ url: data.url, filename: data.filename });
      }
    } finally {
      setUploading(false);
    }
  }

  const showCustomFields = selectedKey === 'custom';
  const showOptions =
    showCustomFields &&
    (customType === 'multichoice' || customType === 'singlechoice');
  const showDocument = selectedKey === 'document';

  const canAdd =
    selectedKey === 'document'
      ? !!uploadedFile && documentLabel.trim() !== ''
      : selectedKey === 'custom'
        ? customTitle.trim() !== '' &&
          (!showOptions || options.some((o) => o.trim() !== ''))
        : false;

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <p className="text-sm font-semibold">Neues Feld</p>

      <Field>
        <FieldLabel htmlFor="new-field-type">Feldtyp</FieldLabel>
        <Select
          value={selectedKey}
          onValueChange={(v) => setSelectedKey(v as SelectedKey)}
        >
          <SelectTrigger id="new-field-type" size="default" className="w-full">
            <SelectValue placeholder="Feld auswaehlen..." />
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

      {showDocument && (
        <>
          <Field>
            <FieldLabel htmlFor="new-doc-label">Dokumentname</FieldLabel>
            <Input
              id="new-doc-label"
              placeholder="z.B. Datenschutzerklaerung"
              value={documentLabel}
              onChange={(e) => setDocumentLabel(e.target.value)}
              className="h-10"
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
                  onClick={() => {
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
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
              >
                <Upload className="mr-2 size-4" />
                {uploading ? 'Hochladen...' : 'Datei auswaehlen'}
              </Button>
            )}
          </Field>
        </>
      )}

      {showCustomFields && (
        <>
          <Field>
            <FieldLabel htmlFor="new-field-name">Feldname</FieldLabel>
            <Input
              id="new-field-name"
              placeholder="z.B. Lieblingsfarbe"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="h-10"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-field-subtype">Typ</FieldLabel>
            <Select
              value={customType}
              onValueChange={(v) => setCustomType(v as CustomFieldType)}
            >
              <SelectTrigger
                id="new-field-subtype"
                size="default"
                className="w-full"
              >
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
          {showOptions && (
            <div className="space-y-2">
              <FieldLabel>Optionen</FieldLabel>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, j) => (j === i ? e.target.value : o)),
                      )
                    }
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() =>
                        setOptions((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => [...prev, ''])}
              >
                <Plus className="mr-2 size-4" />
                Option
              </Button>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!canAdd}>
          Hinzufuegen
        </Button>
      </div>
    </div>
  );
}

// --- Main sheet component ---

export function EditBlockSheet({
  block,
  open,
  onOpenChange,
  onSaveBlock,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderFields,
}: {
  block: Block | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveBlock: (
    blockId: string,
    updates: Partial<Pick<Block, 'title' | 'description' | 'icon'>>,
  ) => void;
  onAddField?: (blockId: string, field: FormField) => void;
  onEditField?: (
    blockId: string,
    fieldId: string,
    updates: Partial<FormField>,
  ) => void;
  onDeleteField?: (blockId: string, fieldId: string) => void;
  onReorderFields?: (blockId: string, orderedFields: FormField[]) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('none');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [metaDirty, setMetaDirty] = useState(false);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);

  // Sync local state when block changes
  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDescription(block.description ?? '');
      setIcon(block.icon ?? 'none');
      setEditingFieldId(null);
      setAddingField(false);
      setMetaDirty(false);
    }
  }, [block]);

  // Track if metadata has changed
  useEffect(() => {
    if (!block) return;
    const dirty =
      title.trim() !== block.title ||
      (description.trim() || undefined) !== (block.description || undefined) ||
      (icon !== 'none' ? icon : undefined) !== (block.icon || undefined);
    setMetaDirty(dirty);
  }, [title, description, icon, block]);

  function handleSaveMeta() {
    if (!block || !title.trim()) return;
    onSaveBlock(block.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      icon: icon && icon !== 'none' ? icon : undefined,
    });
    setMetaDirty(false);
  }

  function moveField(sourceId: string, targetId: string) {
    if (!block || !onReorderFields) return;
    if (sourceId === targetId) return;
    const oldIndex = block.fields.findIndex((f) => f.id === sourceId);
    const newIndex = block.fields.findIndex((f) => f.id === targetId);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(block.fields, oldIndex, newIndex);
    onReorderFields(block.id, next);
  }

  if (!block) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Block bearbeiten</SheetTitle>
          <SheetDescription>
            Aenderungen an diesem Block wirken sich auf alle Formulare aus, die
            ihn verwenden.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Block metadata */}
          <div className="mt-6 space-y-4">
            <Field>
              <FieldLabel htmlFor="sheet-block-title">Titel</FieldLabel>
              <Input
                id="sheet-block-title"
                placeholder="z.B. Persoenliche Daten"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sheet-block-description">
                Beschreibung (optional)
              </FieldLabel>
              <Input
                id="sheet-block-description"
                placeholder="z.B. Bitte geben Sie Ihre persoenlichen Daten ein"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sheet-block-icon">
                Icon (optional)
              </FieldLabel>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger
                  id="sheet-block-icon"
                  size="default"
                  className="w-full"
                >
                  <SelectValue placeholder="Icon auswaehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator className="my-6" />

          {/* Fields section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Felder ({block.fields.length})
              </h3>
              {onAddField && !addingField && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingFieldId(null);
                    setAddingField(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Feld
                </Button>
              )}
            </div>

            {block.fields.length === 0 && !addingField && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Noch keine Felder in diesem Block.
              </p>
            )}

            {block.fields.map((field) =>
              editingFieldId === field.id && onEditField ? (
                <InlineFieldEditor
                  key={field.id}
                  field={field}
                  onSave={(updates) => {
                    onEditField(block.id, field.id, updates);
                    setEditingFieldId(null);
                  }}
                  onCancel={() => setEditingFieldId(null)}
                />
              ) : (
                <DraggableFieldRow
                  key={field.id}
                  field={field}
                  canSort={!!onReorderFields}
                  dragging={draggingFieldId === field.id}
                  onDragStart={
                    onReorderFields
                      ? () => {
                          setDraggingFieldId(field.id);
                        }
                      : undefined
                  }
                  onDragEnd={
                    onReorderFields
                      ? () => {
                          setDraggingFieldId(null);
                        }
                      : undefined
                  }
                  onDragOver={
                    onReorderFields
                      ? (overId) => {
                          if (!draggingFieldId) return;
                          moveField(draggingFieldId, overId);
                        }
                      : undefined
                  }
                  onToggleRequired={
                    onEditField
                      ? (next) => onEditField(block.id, field.id, { required: next })
                      : undefined
                  }
                  onEdit={
                    onEditField
                      ? () => {
                          setAddingField(false);
                          setEditingFieldId(field.id);
                        }
                      : undefined
                  }
                  onDelete={
                    onDeleteField ? () => onDeleteField(block.id, field.id) : undefined
                  }
                />
              ),
            )}

            {addingField && onAddField && (
              <AddFieldInline
                onAdd={(field) => {
                  onAddField(block.id, field);
                  setAddingField(false);
                }}
                onCancel={() => setAddingField(false)}
              />
            )}
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Schliessen
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (metaDirty) handleSaveMeta();
                onOpenChange(false);
              }}
              disabled={!title.trim()}
            >
              <Save className="mr-2 size-4" />
              Speichern
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DraggableFieldRow({
  field,
  canSort,
  dragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onToggleRequired,
  onEdit,
  onDelete,
}: {
  field: FormField;
  canSort: boolean;
  dragging: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (overId: string) => void;
  onToggleRequired?: (next: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={[
        'group flex items-center gap-3 rounded-lg border px-4 py-3',
        dragging ? 'bg-muted/40 shadow-sm' : '',
      ].join(' ')}
      onDragOver={(e) => {
        if (!canSort) return;
        e.preventDefault();
        onDragOver?.(field.id);
      }}
      onDrop={(e) => {
        if (!canSort) return;
        e.preventDefault();
      }}
    >
      <button
        type="button"
        className="text-muted-foreground cursor-grab active:cursor-grabbing"
        aria-label="Feld verschieben"
        draggable={canSort}
        onDragStart={() => onDragStart?.()}
        onDragEnd={() => onDragEnd?.()}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{field.label}</span>
          <Badge variant="outline" className="text-[10px]">
            {FIELD_TYPE_LABELS[field.type] ?? field.type}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {field.required ? 'Pflichtig' : 'Optional'}
            </span>
            <Switch
              size="sm"
              checked={field.required}
              onCheckedChange={(checked) => onToggleRequired?.(checked)}
              disabled={!onToggleRequired}
            />
          </div>
        </div>
        {field.description && (
          <p className="text-muted-foreground mt-0.5 text-xs">{field.description}</p>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive size-10"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const next = array.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
