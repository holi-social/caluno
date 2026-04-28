'use client';

import { useEffect, useState } from 'react';
import { Button, Separator } from '@repo/ui';
import { ArrowLeft, Plus, Redo2, Save, Undo2 } from 'lucide-react';
import Link from 'next/link';
import type { FieldType, FormConfig, FormField, FormSection } from '@/lib/types';
import { useUndoRedo } from '@/lib/use-undo-redo';
import { SectionCard } from './section-card';
import { AddFieldDialog } from './add-field-dialog';
import { AddSectionDialog } from './add-section-dialog';
import { EditFieldDialog } from './edit-field-dialog';
import { FormPreview } from './form-preview';

export function BuilderLayout({
  initialConfig,
}: {
  initialConfig: FormConfig;
}) {
  const {
    state: config,
    set: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<FormConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addFieldSectionId, setAddFieldSectionId] = useState<string | null>(
    null,
  );
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editField, setEditField] = useState<{ sectionId: string; fieldId: string } | null>(null);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  function handleAddField(field: FormField) {
    if (!addFieldSectionId) return;
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === addFieldSectionId
          ? { ...s, fields: [...s.fields, field] }
          : s,
      ),
    }));
    setAddFieldSectionId(null);
  }

  function handleAddSection(section: FormSection) {
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
  }

  function handleToggleRequired(sectionId: string, fieldId: string) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, required: !f.required } : f,
              ),
            }
          : s,
      ),
    }));
  }

  function handleChangeFieldType(
    sectionId: string,
    fieldId: string,
    newType: FieldType,
    opts?: { options?: { label: string; value: string }[] },
  ) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId
                  ? {
                      ...f,
                      type: newType,
                      options:
                        newType === 'singlechoice' ||
                        newType === 'multichoice' ||
                        newType === 'select'
                          ? (opts?.options ?? f.options ?? [])
                          : undefined,
                    }
                  : f,
              ),
            }
          : s,
      ),
    }));
  }

  function handleEditField(sectionId: string, fieldId: string, updates: Partial<FormField>) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f,
              ),
            }
          : s,
      ),
    }));
  }

  function handleDeleteSection(sectionId: string) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  }

  function handleDeleteField(sectionId: string, fieldId: string) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s,
      ),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/forms/${config.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Editor */}
      <div className="flex-1 overflow-y-auto border-r">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {/* Back + Breadcrumb */}
          <div className="mb-3 flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="size-9 rounded-xl">
              <Link href="/">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <p className="text-muted-foreground text-sm font-medium">
              {config.organizationName} &rsaquo; {config.name}
            </p>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Profilname</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
                disabled={!canUndo}
                onClick={undo}
                aria-label="Rückgängig"
              >
                <Undo2 className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
                disabled={!canRedo}
                onClick={redo}
                aria-label="Wiederholen"
              >
                <Redo2 className="size-5" />
              </Button>
              <Button variant="outline" size="lg" disabled>
                Auf Schichten anwenden
              </Button>
            </div>
          </div>

          {/* Section cards */}
          <div className="space-y-4">
            {config.sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onAddField={
                  section.locked
                    ? undefined
                    : () => setAddFieldSectionId(section.id)
                }
                onToggleRequired={(fieldId) => handleToggleRequired(section.id, fieldId)}
                onChangeFieldType={(fieldId, newType, opts) =>
                  handleChangeFieldType(section.id, fieldId, newType, opts)
                }
                onEditField={(fieldId) =>
                  setEditField({ sectionId: section.id, fieldId })
                }
                onDeleteSection={() => handleDeleteSection(section.id)}
                onDeleteField={(fieldId) => handleDeleteField(section.id, fieldId)}
              />
            ))}
          </div>

          <Separator className="my-8" />

          {/* Add requirement / Save */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setAddSectionOpen(true)}
            >
              <Plus className="mr-2 size-5" />
              Anforderung hinzufügen
            </Button>

            <Button size="lg" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 size-5" />
              {saved ? 'Gespeichert!' : saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="bg-muted/30 w-[380px] shrink-0 overflow-y-auto p-6">
        <FormPreview config={config} />
      </div>

      {/* Add field dialog */}
      <AddFieldDialog
        open={addFieldSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setAddFieldSectionId(null);
        }}
        onAdd={handleAddField}
      />

      {/* Add section dialog */}
      <AddSectionDialog
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        onAdd={handleAddSection}
      />

      {/* Edit field dialog */}
      <EditFieldDialog
        field={
          editField
            ? (config.sections
                .find((s) => s.id === editField.sectionId)
                ?.fields.find((f) => f.id === editField.fieldId) ?? null)
            : null
        }
        open={editField !== null}
        onOpenChange={(open) => {
          if (!open) setEditField(null);
        }}
        onSave={(fieldId, updates) => {
          if (editField) handleEditField(editField.sectionId, fieldId, updates);
        }}
      />
    </div>
  );
}
