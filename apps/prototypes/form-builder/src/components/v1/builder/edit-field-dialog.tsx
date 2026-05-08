'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
} from '@repo/ui';
import type { FormField } from '@/lib/types';

export function EditFieldDialog({
  field,
  open,
  onOpenChange,
  onSave,
}: {
  field: FormField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fieldId: string, updates: Partial<FormField>) => void;
}) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setDescription(field.description ?? '');
    }
  }, [field]);

  function handleSave() {
    if (!field || !label.trim()) return;
    onSave(field.id, {
      label: label.trim(),
      description: description.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Feld bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <Field>
            <FieldLabel htmlFor="edit-label">Feldname</FieldLabel>
            <Input
              id="edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-11 text-base"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-description">Beschreibung</FieldLabel>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Hilfestellung"
              className="h-11 text-base"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button size="lg" onClick={handleSave} disabled={!label.trim()}>
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
