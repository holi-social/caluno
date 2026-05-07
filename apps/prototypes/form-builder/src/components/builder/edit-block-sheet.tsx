'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
} from '@repo/ui';
import {
  AlertTriangle,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Block, FieldType, FormField } from '@/lib/types';
import { FIELD_TYPE_LABELS, FIELD_TYPE_OPTIONS } from '@/lib/predefined-fields';

// --- Field form (used for both creating and editing fields) ---

type FieldCommitHandle = { commit: () => boolean };

const FieldForm = forwardRef<
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
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    filename: string;
  } | null>(() => {
    if (initial?.type === 'document-acknowledgement' && initial.documentUrl) {
      const filename = initial.documentUrl.split('/').pop() ?? 'Dokument';
      return { url: initial.documentUrl, filename };
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleSubmit() {
    commit();
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
              isDocument
                ? 'z.B. Datenschutzerklärung'
                : 'z.B. Lieblingsfarbe'
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
              {uploading ? 'Wird hochgeladen...' : 'Datei auswählen'}
            </Button>
          )}
        </Field>
      )}

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
            onClick={() => setOptions((prev) => [...prev, ''])}
          >
            <Plus className="mr-2 size-4" />
            Option
          </Button>
        </div>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isEdit ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>
    </div>
  );
});

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
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [metaDirty, setMetaDirty] = useState(false);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const addFieldRef = useRef<FieldCommitHandle>(null);
  const editFieldRef = useRef<FieldCommitHandle>(null);

  // Sync local state only when a different block is loaded (not on every block update,
  // since field add/edit produces a new block reference and would otherwise wipe
  // the user's in-progress title/description.)
  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDescription(block.description ?? '');
      setEditingFieldId(null);
      setAddingField(false);
      setMetaDirty(false);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: only re-init on a different block
  }, [block?.id]);

  // Track if metadata has changed
  useEffect(() => {
    if (!block) return;
    const dirty =
      title.trim() !== block.title ||
      (description.trim() || undefined) !== (block.description || undefined);
    setMetaDirty(dirty);
  }, [title, description, block]);

  // Auto-focus the title input when the sheet opens
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(id);
  }, [open]);

  function handleSaveMeta() {
    if (!block || !title.trim()) return;
    onSaveBlock(block.id, {
      title: title.trim(),
      description: description.trim() || undefined,
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

  function handleSheetOpenChange(next: boolean) {
    if (!next && metaDirty && title.trim()) {
      handleSaveMeta();
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-2xl font-bold">
            Block bearbeiten
          </SheetTitle>
          <div className="mt-2 flex items-start gap-2 rounded-lg border p-3">
            <AlertTriangle className="text-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-foreground text-base">
              Änderungen an diesem Block wirken sich auf alle Formulare aus,
              die ihn verwenden.
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Block metadata */}
          <div className="mt-6 space-y-4">
            <Field>
              <FieldLabel htmlFor="sheet-block-title">Titel</FieldLabel>
              <Input
                id="sheet-block-title"
                ref={titleInputRef}
                placeholder="z.B. Persönliche Daten"
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
                <FieldForm
                  key={field.id}
                  ref={editFieldRef}
                  initial={field}
                  onSubmit={(updated) => {
                    onEditField(block.id, field.id, updated);
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
                      ? (next) =>
                          onEditField(block.id, field.id, { required: next })
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
                    onDeleteField
                      ? () => onDeleteField(block.id, field.id)
                      : undefined
                  }
                />
              ),
            )}

            {addingField && onAddField && (
              <FieldForm
                ref={addFieldRef}
                onSubmit={(field) => {
                  onAddField(block.id, field);
                  setAddingField(false);
                }}
                onCancel={() => setAddingField(false)}
              />
            )}
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Schliessen
            </Button>
            <Button
              size="lg"
              onClick={() => {
                // Force-commit any in-progress field. If validation fails,
                // the inline form surfaces an error and we keep the sheet open.
                if (addingField && addFieldRef.current) {
                  if (!addFieldRef.current.commit()) return;
                }
                if (editingFieldId && editFieldRef.current) {
                  if (!editFieldRef.current.commit()) return;
                }
                handleSheetOpenChange(false);
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
          <p className="text-muted-foreground mt-0.5 text-xs">
            {field.description}
          </p>
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
  const [item] = next.splice(from, 1) as [T];
  next.splice(to, 0, item);
  return next;
}
