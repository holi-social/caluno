'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  currentFormId,
  canEdit = true,
  open,
  onOpenChange,
  onCommit,
  onCreateCopy,
  onSwapBlockRef,
}: {
  block: Block | null;
  /** All forms; when provided, the sheet shows which forms reference this block. */
  forms?: FormConfig[];
  /** Set when this sheet is opened from a form editor. Used to bypass the
   *  Save-confirmation dialog when the current form is the only consumer. */
  currentFormId?: string;
  /** When false, the sheet renders as read-only — no field editing,
   *  no Save button. Matches the previous "no onAddField/onEditField" gate. */
  canEdit?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persist the whole edited block in one PUT. Called only when the user
   *  explicitly clicks Speichern (or one of the two save modes in the
   *  confirmation dialog). Field add/edit/delete/reorder + title/
   *  description all live in local state until this fires. */
  onCommit: (
    updated: Block,
    options: { requestResubmit: boolean },
  ) => Promise<void> | void;
  /** Create a new block from the edited state. The persisted block stays
   *  untouched because nothing was flushed until now. Returns the new
   *  block so the caller can swap a form's blockRef to it. */
  onCreateCopy?: (editedBlock: Block, copyTitle: string) => Promise<Block>;
  /** Swap a form's blockRef from oldBlockId to newBlockId — wired by the
   *  form-editor entry point so a "Kopie erstellen" rebinds the form to
   *  the new block in one step. */
  onSwapBlockRef?: (oldBlockId: string, newBlockId: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Local draft of the block's fields. All add / edit / delete / reorder
  // operations write here, NOT to the server. Flushed in one PUT only when
  // the user explicitly clicks Speichern. Seeded from `block.fields` on
  // open and discarded on close (which makes "Verwerfen" a no-op rollback).
  const [localFields, setLocalFields] = useState<FormField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  // The field type the user picked from the "Feld hinzufügen" flyout. When
  // non-null we render a FieldForm with this type pre-locked so the user
  // skips the in-form type Select entirely (it's now the flyout's job).
  const [addType, setAddType] = useState<FieldType | null>(null);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  // 'save' = user clicked Speichern; 'close' = user tried to dismiss the
  // sheet with dirty state. Both arrive at the same confirmation gate but
  // the post-action behaviour differs slightly (close always exits after).
  const [confirmIntent, setConfirmIntent] = useState<'save' | 'close' | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const addFieldRef = useRef<FieldCommitHandle>(null);
  const editFieldRef = useRef<FieldCommitHandle>(null);

  // Seed local draft state from the persisted block whenever the sheet
  // opens (or a different block is loaded). Field operations during the
  // session write to `localFields` only, so the `block` prop stays stable
  // as the "saved" baseline against which `hasChanges` is computed. Closing
  // the sheet throws the draft away — that's how Verwerfen works now.
  useEffect(() => {
    if (open && block) {
      setTitle(block.title);
      setDescription(block.description ?? '');
      setLocalFields(structuredClone(block.fields));
      setEditingFieldId(null);
      setAddType(null);
    } else if (!open) {
      setConfirmIntent(null);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: only re-init on open/close or different block
  }, [open, block?.id]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(id);
  }, [open]);

  if (!block) return null;

  // --- Local field mutators (write to draft state only) --------------------

  function localAddField(field: FormField) {
    setLocalFields((prev) => [...prev, field]);
  }

  function localEditField(fieldId: string, updates: Partial<FormField>) {
    setLocalFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    );
  }

  function localDeleteField(fieldId: string) {
    setLocalFields((prev) => prev.filter((f) => f.id !== fieldId));
  }

  function moveField(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const oldIndex = localFields.findIndex((f) => f.id === sourceId);
    const newIndex = localFields.findIndex((f) => f.id === targetId);
    if (oldIndex === -1 || newIndex === -1) return;
    setLocalFields(arrayMove(localFields, oldIndex, newIndex));
  }

  // --- Confirmation + dirty-state -----------------------------------------

  const usedInForms =
    forms?.filter((f) =>
      f.blockRefs.some((ref) => ref.blockId === block.id),
    ) ?? [];

  const onlyInCurrentForm =
    !!currentFormId &&
    usedInForms.length === 1 &&
    usedInForms[0]!.id === currentFormId;
  // No confirmation when (a) the block isn't referenced by any form, or
  // (b) we're in the form editor and this form is the sole consumer.
  // Anything else (block-card entry on a shared block, multi-form usage) → confirm.
  const requiresConfirmation = usedInForms.length > 0 && !onlyInCurrentForm;

  const titleChanged = title.trim() !== block.title;
  const descriptionChanged =
    (description.trim() || undefined) !== (block.description || undefined);
  const fieldsChanged =
    JSON.stringify(localFields) !== JSON.stringify(block.fields);
  const hasChanges = titleChanged || descriptionChanged || fieldsChanged;

  function buildEditedBlock(): Block {
    return {
      ...block!,
      title: title.trim() || block!.title,
      description: description.trim() || undefined,
      fields: localFields,
    };
  }

  // --- Save / close handlers ----------------------------------------------

  function handleSheetOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }
    // No-confirm path: flush the draft and exit. (Lone block, or form-editor
    // entry with this form as the sole consumer.)
    if (!requiresConfirmation) {
      void runCommit({ requestResubmit: false });
      return;
    }
    setConfirmIntent('close');
  }

  function commitInProgressFields(): boolean {
    if (addType !== null && addFieldRef.current) {
      if (!addFieldRef.current.commit()) {
        addFieldRef.current.scrollToError();
        return false;
      }
    }
    if (editingFieldId && editFieldRef.current) {
      if (!editFieldRef.current.commit()) {
        editFieldRef.current.scrollToError();
        return false;
      }
    }
    return true;
  }

  async function runCommit(options: { requestResubmit: boolean }) {
    setBusy(true);
    try {
      await onCommit(buildEditedBlock(), options);
    } finally {
      setBusy(false);
      setConfirmIntent(null);
      onOpenChange(false);
    }
  }

  function handleSaveClick() {
    if (!commitInProgressFields()) return;
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }
    if (!requiresConfirmation) {
      void runCommit({ requestResubmit: false });
      return;
    }
    setConfirmIntent('save');
  }

  function handleDialogSaveAnyway() {
    void runCommit({ requestResubmit: true });
  }

  function handleDialogSaveSilently() {
    void runCommit({ requestResubmit: false });
  }

  async function handleDialogCreateCopy() {
    if (!onCreateCopy) {
      setConfirmIntent(null);
      return;
    }
    setBusy(true);
    try {
      const copyTitle = `${block!.title} Kopie`;
      const newBlock = await onCreateCopy(buildEditedBlock(), copyTitle);
      if (currentFormId && onSwapBlockRef) {
        onSwapBlockRef(block!.id, newBlock.id);
      }
    } finally {
      setBusy(false);
      setConfirmIntent(null);
      onOpenChange(false);
    }
  }

  // "Feld hinzufügen" — opens a flyout with all custom field types. Clicking
  // a type sets `addType` to that FieldType, which renders FieldForm with
  // `lockedType` set so the in-form Feldtyp Select stays hidden.
  const fieldPicker = canEdit && (
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
  const documentButton = canEdit && (
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
    (p) => !getSystemRequirementKeysInUse(localFields).has(p.key),
  );
  const profilePicker = canEdit && availableSystemPresets.length > 0 && (
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
                localAddField(createSystemRequirementField(preset.key));
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
              Felder ({localFields.length})
            </h3>

            {localFields.length === 0 && addType === null && (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Noch keine Felder in diesem Block.
                </p>
              </div>
            )}

            {localFields.map((field) =>
              editingFieldId === field.id && canEdit ? (
                <FieldForm
                  key={field.id}
                  ref={editFieldRef}
                  initial={field}
                  onSubmit={(updated) => {
                    localEditField(field.id, updated);
                    setEditingFieldId(null);
                  }}
                  onCancel={() => setEditingFieldId(null)}
                />
              ) : (
                <DraggableFieldRow
                  key={field.id}
                  field={field}
                  canSort={canEdit}
                  dragging={draggingFieldId === field.id}
                  onDragStart={
                    canEdit
                      ? () => setDraggingFieldId(field.id)
                      : undefined
                  }
                  onDragEnd={
                    canEdit ? () => setDraggingFieldId(null) : undefined
                  }
                  onDragOver={
                    canEdit
                      ? (overId) => {
                          if (!draggingFieldId) return;
                          moveField(draggingFieldId, overId);
                        }
                      : undefined
                  }
                  onToggleRequired={
                    canEdit
                      ? (next) => localEditField(field.id, { required: next })
                      : undefined
                  }
                  onEdit={
                    canEdit
                      ? () => {
                          setAddType(null);
                          setEditingFieldId(field.id);
                        }
                      : undefined
                  }
                  onDelete={
                    canEdit ? () => localDeleteField(field.id) : undefined
                  }
                />
              ),
            )}

            {addType === null && canEdit && (
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

            {addType !== null && canEdit && (
              <FieldForm
                ref={addFieldRef}
                lockedType={addType}
                onSubmit={(field) => {
                  localAddField(field);
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
              onClick={() => handleSheetOpenChange(false)}
            >
              Schliessen
            </Button>
            <Button
              size="lg"
              onClick={handleSaveClick}
              disabled={!title.trim() || busy}
            >
              <Save className="mr-2 size-4" />
              Speichern
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>

      <Dialog
        open={confirmIntent !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmIntent(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Dieser Block wird in {usedInForms.length}{' '}
              {usedInForms.length === 1 ? 'Formular' : 'Formularen'} verwendet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Wählen Sie, wie Ihre Änderungen übernommen werden sollen.
            </DialogDescription>
          </DialogHeader>
          {usedInForms.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Verwendet in
              </p>
              <div className="flex flex-wrap gap-1.5">
                {usedInForms.map((f) => (
                  <Badge key={f.id} variant="outline" className="text-sm">
                    {f.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-3 sm:flex-col sm:items-stretch sm:space-x-0">
            {/* Coupled save options — same action, two intents */}
            <div className="flex flex-col gap-1">
              <Button
                onClick={handleDialogSaveAnyway}
                disabled={busy}
                className="h-10"
              >
                Speichern und neu einreichen lassen
              </Button>
              <Button
                variant="outline"
                onClick={handleDialogSaveSilently}
                disabled={busy}
                className="h-10"
              >
                Stillschweigend speichern
              </Button>
            </div>
            {onCreateCopy && (
              <Button
                variant="secondary"
                onClick={handleDialogCreateCopy}
                disabled={busy}
                className="h-10"
              >
                Kopie erstellen ({block.title} Kopie)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
