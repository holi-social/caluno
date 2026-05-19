'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui';
import { AlertTriangle, FileText, Plus, Save, UserCircle2 } from 'lucide-react';
import type { Block, FieldType, FormConfig, FormField } from '@/lib/types';
import { FIELD_TYPE_OPTIONS } from '@/lib/predefined-fields';
import {
  SYSTEM_REQUIREMENT_LIST,
  createSystemRequirementField,
  getSystemRequirementKeysInUse,
} from '@/lib/system-requirements';
import { FieldForm, type FieldCommitHandle } from './field-form';
import { DraggableFieldRow, arrayMove } from './draggable-field-row';
import { AvailableSystemFieldCard } from './available-system-field-card';

export function EditBlockSheet({
  block,
  forms,
  open,
  onOpenChange,
  onSaveBlock,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderFields,
}: {
  block: Block | null;
  /** All forms; when provided, the sheet shows which forms reference this block. */
  forms?: FormConfig[];
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
  // The field type the user picked from the "Feld hinzufügen" flyout. When
  // non-null we render a FieldForm with this type pre-locked so the user
  // skips the in-form type Select entirely (it's now the flyout's job).
  const [addType, setAddType] = useState<FieldType | null>(null);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);
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
      setAddType(null);
      setMetaDirty(false);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: only re-init on a different block
  }, [block?.id]);

  useEffect(() => {
    if (!block) return;
    const dirty =
      title.trim() !== block.title ||
      (description.trim() || undefined) !== (block.description || undefined);
    setMetaDirty(dirty);
  }, [title, description, block]);

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

  const usedInForms =
    forms?.filter((f) =>
      f.blockRefs.some((ref) => ref.blockId === block.id),
    ) ?? [];

  // "Feld hinzufügen" — opens a flyout with all custom field types. Clicking
  // a type sets `addType` to that FieldType, which renders FieldForm with
  // `lockedType` set so the in-form Feldtyp Select stays hidden.
  const fieldPicker = onAddField && (
    <Popover open={fieldPickerOpen} onOpenChange={setFieldPickerOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 size-4" />
          Feld hinzufügen
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[28rem] flex-col p-0"
        collisionPadding={16}
      >
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {FIELD_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setEditingFieldId(null);
                setAddType(opt.value);
                setFieldPickerOpen(false);
              }}
              className="hover:border-primary hover:bg-accent w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  // "Profilfeld hinzufügen" — opens a flyout with the system-requirement
  // presets not yet used in this block. Sticky intro stays above the
  // scrollable card list so the rationale is always visible.
  // "Dokument hinzufügen" stays as a top-level shortcut even though
  // document-acknowledgement is also reachable from the Feld picker —
  // docs are a high-frequency action and worth a single-click affordance.
  const documentButton = onAddField && (
    <Button
      variant="outline"
      onClick={() => {
        setEditingFieldId(null);
        setAddType('document-acknowledgement');
      }}
    >
      <FileText className="mr-2 size-4" />
      Dokument hinzufügen
    </Button>
  );

  const availableSystemPresets = SYSTEM_REQUIREMENT_LIST.filter(
    (p) => !getSystemRequirementKeysInUse(block.fields).has(p.key),
  );
  const profilePicker = onAddField && availableSystemPresets.length > 0 && (
    <Popover open={profilePickerOpen} onOpenChange={setProfilePickerOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <UserCircle2 className="mr-2 size-4" />
          Profilfeld hinzufügen
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[28rem] flex-col p-0"
        collisionPadding={16}
      >
        <div className="shrink-0 border-b p-4">
          <p className="text-muted-foreground text-sm">
            Freiwillige müssen diese Angaben nur einmal ausfüllen. Danach
            können sie in anderen Unterorganisationen wiederverwendet werden.
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {availableSystemPresets.map((preset) => (
            <AvailableSystemFieldCard
              key={preset.key}
              preset={preset}
              onAdd={() => {
                onAddField(block.id, createSystemRequirementField(preset.key));
                setProfilePickerOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-2xl font-bold">
            Block bearbeiten
          </SheetTitle>
          {usedInForms.length > 0 && (
            <div className="mt-2 rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-foreground mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-base">
                    Änderungen an diesem Block wirken sich auf alle Formulare
                    aus, die ihn verwenden.
                  </p>
                  <div className="mt-1.5">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Verwendet in
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {usedInForms.map((f) => (
                        <Badge
                          key={f.id}
                          variant="outline"
                          className="text-sm"
                        >
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="mt-2 space-y-4">
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

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">
              Felder ({block.fields.length})
            </h3>

            {block.fields.length === 0 && addType === null && (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Noch keine Felder in diesem Block.
                </p>
              </div>
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
                      ? () => setDraggingFieldId(field.id)
                      : undefined
                  }
                  onDragEnd={
                    onReorderFields
                      ? () => setDraggingFieldId(null)
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
                          setAddType(null);
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

            {addType === null && onAddField && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  {fieldPicker}
                  {profilePicker}
                </div>
                <div className="flex items-center justify-center">
                  {documentButton}
                </div>
              </div>
            )}

            {addType !== null && onAddField && (
              <FieldForm
                ref={addFieldRef}
                lockedType={addType}
                onSubmit={(field) => {
                  onAddField(block.id, field);
                  setAddType(null);
                }}
                onCancel={() => setAddType(null)}
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
                // surface the error inline and scroll the failing field into
                // view so the user doesn't have to hunt for it.
                if (addType !== null && addFieldRef.current) {
                  if (!addFieldRef.current.commit()) {
                    addFieldRef.current.scrollToError();
                    return;
                  }
                }
                if (editingFieldId && editFieldRef.current) {
                  if (!editFieldRef.current.commit()) {
                    editFieldRef.current.scrollToError();
                    return;
                  }
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
