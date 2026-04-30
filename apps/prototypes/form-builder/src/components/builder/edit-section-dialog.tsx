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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import type { Block } from '@/lib/types';

const ICON_OPTIONS = [
  { label: 'Kein Icon', value: 'none' },
  { label: 'Person', value: 'User' },
  { label: 'Adresse', value: 'MapPin' },
  { label: 'Dokument', value: 'FileCheck' },
  { label: 'Finanzen', value: 'Banknote' },
];

export function EditBlockDialog({
  block,
  open,
  onOpenChange,
  onSave,
}: {
  block: Block | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    blockId: string,
    updates: Partial<Pick<Block, 'title' | 'description' | 'icon'>>,
  ) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('none');

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDescription(block.description ?? '');
      setIcon(block.icon ?? 'none');
    }
  }, [block]);

  function handleSave() {
    if (!block || !title.trim()) return;
    onSave(block.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      icon: icon && icon !== 'none' ? icon : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Block bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <Field>
            <FieldLabel htmlFor="edit-block-title">Titel</FieldLabel>
            <Input
              id="edit-block-title"
              placeholder="z.B. Persoenliche Daten"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 text-base"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-block-description">
              Beschreibung (optional)
            </FieldLabel>
            <Input
              id="edit-block-description"
              placeholder="z.B. Bitte füllen Sie Ihre persoenlichen Daten aus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 text-base"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-block-icon">Icon (optional)</FieldLabel>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger
                id="edit-block-icon"
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
          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button size="lg" onClick={handleSave} disabled={!title.trim()}>
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
