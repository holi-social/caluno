'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
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
} from '@repo/ui';
import { Plus } from 'lucide-react';
import type { FormSection } from '@/lib/types';
import {
  PRESET_SECTIONS,
  FIELD_TYPE_LABELS,
  getPredefinedField,
} from '@/lib/predefined-fields';

const ICON_OPTIONS = [
  { label: 'Kein Icon', value: '' },
  { label: 'Person', value: 'User' },
  { label: 'Adresse', value: 'MapPin' },
  { label: 'Dokument', value: 'FileCheck' },
  { label: 'Finanzen', value: 'Banknote' },
];

function buildSection(preset: (typeof PRESET_SECTIONS)[number]): FormSection {
  const now = Date.now();
  return {
    id: `sec-${now}`,
    title: preset.title,
    icon: preset.icon,
    fields: preset.fieldKeys.map((key, i) => ({
      ...getPredefinedField(key),
      id: `field-${now}-${i}`,
    })),
  };
}

export function AddSectionDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (section: FormSection) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');

  function reset() {
    setShowCustom(false);
    setTitle('');
    setIcon('');
  }

  function handlePresetClick(preset: (typeof PRESET_SECTIONS)[number]) {
    onAdd(buildSection(preset));
    reset();
    onOpenChange(false);
  }

  function handleCustomAdd() {
    if (!title.trim()) return;
    onAdd({
      id: `sec-${Date.now()}`,
      title: title.trim(),
      icon: icon && icon !== 'none' ? icon : undefined,
      fields: [],
    });
    reset();
    onOpenChange(false);
  }

  if (showCustom) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Eigener Abschnitt</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <Field>
              <FieldLabel htmlFor="section-title">Titel</FieldLabel>
              <Input
                id="section-title"
                placeholder="z.B. Persönliche Daten"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="section-icon">Icon (optional)</FieldLabel>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="section-icon" size="default" className="w-full">
                  <SelectValue placeholder="Icon auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <Button size="lg" variant="outline" onClick={() => setShowCustom(false)}>
                Zurück
              </Button>
              <Button size="lg" onClick={handleCustomAdd} disabled={!title.trim()}>
                Hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Neuer Abschnitt</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Das Inhalt kann später verarbeitet werden
          </p>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          {PRESET_SECTIONS.map((preset) => {
            const fields = preset.fieldKeys.map((k) => getPredefinedField(k));
            return (
              <button
                key={preset.title}
                type="button"
                className="hover:border-primary hover:bg-accent cursor-pointer rounded-xl border p-4 text-left transition-colors"
                onClick={() => handlePresetClick(preset)}
              >
                <p className="text-base font-semibold">{preset.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {fields.map((f) => (
                    <Badge key={f.label} variant="secondary" className="text-sm">
                      {f.label}
                      <span className="text-muted-foreground ml-1">
                        {FIELD_TYPE_LABELS[f.type] || f.type}
                      </span>
                      {f.required && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </button>
            );
          })}

          {/* Custom section card */}
          <button
            type="button"
            className="hover:border-primary hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors"
            onClick={() => setShowCustom(true)}
          >
            <Plus className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-base font-semibold">Eigener Abschnitt</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
