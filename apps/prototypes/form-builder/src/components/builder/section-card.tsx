'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
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
  Switch,
} from '@repo/ui';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Lock,
  Pencil,
  Plus,
  Trash2,
  User,
  MapPin,
  FileCheck,
  Banknote,
} from 'lucide-react';
import type { FieldType, FormSection } from '@/lib/types';
import { FieldBadge, FieldTypeLabel } from './field-badge';

const ICON_MAP: Record<string, React.ReactNode> = {
  User: <User className="size-5" />,
  MapPin: <MapPin className="size-5" />,
  FileCheck: <FileCheck className="size-5" />,
  Banknote: <Banknote className="size-5" />,
};

// Types that can be freely switched without needing options config
const SIMPLE_TYPES: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'E-Mail', value: 'email' },
  { label: 'Telefon', value: 'phone' },
  { label: 'Datum', value: 'date' },
  { label: 'Zahlen', value: 'numbers' },
  { label: 'Textfeld', value: 'textarea' },
  { label: 'IBAN', value: 'iban' },
  { label: 'PLZ', value: 'plz' },
  { label: 'Passwort', value: 'password' },
];

const COMPLEX_TYPES: { label: string; value: FieldType }[] = [
  { label: 'Einzelauswahl', value: 'singlechoice' },
  { label: 'Mehrfachauswahl', value: 'multichoice' },
  { label: 'Dropdown', value: 'select' },
  { label: 'Checkbox', value: 'checkbox' },
];

const TYPES_REQUIRING_OPTIONS = new Set<FieldType>([
  'multichoice',
  'singlechoice',
  'select',
]);

export function SectionCard({
  section,
  onAddField,
  onToggleRequired,
  onChangeFieldType,
  onDeleteField,
  onEditField,
  onDeleteSection,
}: {
  section: FormSection;
  onAddField?: () => void;
  onToggleRequired?: (fieldId: string) => void;
  onChangeFieldType?: (
    fieldId: string,
    newType: FieldType,
    opts?: { options?: { label: string; value: string }[] },
  ) => void;
  onDeleteField?: (fieldId: string) => void;
  onEditField?: (fieldId: string) => void;
  onDeleteSection?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleteSectionOpen, setDeleteSectionOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeDialogFieldId, setTypeDialogFieldId] = useState<string | null>(null);
  const [typeDialogNewType, setTypeDialogNewType] = useState<FieldType>('text');
  const [typeDialogOptions, setTypeDialogOptions] = useState<string[]>(['', '', '']);
  const icon = section.icon ? ICON_MAP[section.icon] : null;
  const canEditFields = !section.locked && !!onChangeFieldType;

  const typeOptions = useMemo(
    () => [
      { group: 'Einfach', items: SIMPLE_TYPES },
      { group: 'Mit Optionen', items: COMPLEX_TYPES },
    ],
    [],
  );

  function openTypeDialog(fieldId: string, newType: FieldType) {
    setTypeDialogFieldId(fieldId);
    setTypeDialogNewType(newType);
    setTypeDialogOptions(['', '', '']);
    setTypeDialogOpen(true);
  }

  function commitTypeDialog() {
    if (!typeDialogFieldId) return;
    const options = typeDialogOptions
      .map((o) => o.trim())
      .filter(Boolean)
      .map((label) => ({
        label,
        value: label.toLowerCase().replace(/\s+/g, '-'),
      }));
    if (options.length === 0) return;
    onChangeFieldType?.(typeDialogFieldId, typeDialogNewType, { options });
    setTypeDialogOpen(false);
  }

  return (
    <Card className="relative">
      <div className="flex items-start gap-4 p-5">
        <div className="text-muted-foreground mt-1 cursor-grab">
          <GripVertical className="size-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-muted-foreground">{icon}</div>
            )}
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.locked && section.lockedSource && (
              <Badge variant="outline" className="ml-auto gap-1">
                <Lock className="size-3.5" />
                von {section.lockedSource}
              </Badge>
            )}
          </div>

          {!expanded && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {section.fields.map((field) => (
                <FieldBadge key={field.id} field={field} />
              ))}
            </div>
          )}

          {expanded && (
            <div className="mt-3 space-y-3">
              <Separator />
              {section.fields.map((field) => {
                return (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="bg-muted/50 flex min-w-0 flex-1 flex-col items-start justify-start gap-2 rounded-lg px-4 py-3">
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="shrink-0 text-base font-semibold">
                          {field.label}
                        </span>
                        <Select
                          value={field.type}
                          onValueChange={(v) => {
                            if (!canEditFields || field.lockType === true) return;
                            const nextType = v as FieldType;
                            if (TYPES_REQUIRING_OPTIONS.has(nextType)) {
                              openTypeDialog(field.id, nextType);
                              return;
                            }
                            onChangeFieldType?.(field.id, nextType);
                          }}
                        >
                          <SelectTrigger
                            disabled={!canEditFields || field.lockType === true}
                            size="default"
                            className="min-w-[9.5rem] text-sm disabled:pointer-events-none"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((group) => (
                              <div key={group.group}>
                                <div className="text-muted-foreground px-2 py-1 text-[11px] font-medium">
                                  {group.group}
                                </div>
                                {group.items.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                            {section.locked && (
                              <div className="text-muted-foreground px-2 py-2 text-[11px]">
                                Gesperrte Sektion: Typ kann nicht geändert werden
                              </div>
                            )}
                            {field.lockType === true && !section.locked && (
                              <div className="text-muted-foreground px-2 py-2 text-[11px]">
                                Vorgegebenes Feld: Typ kann nicht geändert werden
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-sm font-medium">
                          {field.required ? 'Pflicht' : 'Optional'}
                        </span>
                        <Switch
                          size="default"
                          checked={field.required}
                          onCheckedChange={() => onToggleRequired?.(field.id)}
                          disabled={section.locked || !onToggleRequired}
                        />
                      </div>
                    </div>
                    {!section.locked && (onEditField || onDeleteField) && (
                      <div className="flex flex-col gap-1">
                        {onEditField && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-muted-foreground size-9 shrink-0"
                            disabled={field.lockType === true}
                            onClick={() => onEditField(field.id)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {onDeleteField && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-9 shrink-0"
                            onClick={() => onDeleteField(field.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!section.locked && (onAddField || onDeleteSection) && (
                <div className="mt-2 flex items-center justify-between">
                  {onAddField ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onAddField}
                    >
                      <Plus className="mr-2 size-5" />
                      Feld hinzufügen
                    </Button>
                  ) : <div />}
                  {onDeleteSection && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-foreground hover:text-destructive"
                      onClick={() => {
                        if (section.fields.length >= 1) {
                          setDeleteSectionOpen(true);
                        } else {
                          onDeleteSection();
                        }
                      }}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Abschnitt löschen
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </Button>
        </div>
      </div>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Optionen festlegen</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <p className="text-muted-foreground text-sm">
              Bitte gib mindestens eine Option an, bevor du den Typ zu{' '}
              <Badge variant="outline" className="align-middle">
                <FieldTypeLabel type={typeDialogNewType} />
              </Badge>{' '}
              änderst.
            </p>

            <Field>
              <FieldLabel>Optionen</FieldLabel>
              <div className="space-y-2">
                {typeDialogOptions.map((opt, i) => (
                  <Input
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable list; user edits values inline
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    className="h-11 text-base"
                    onChange={(e) =>
                      setTypeDialogOptions((prev) =>
                        prev.map((o, idx) => (idx === i ? e.target.value : o)),
                      )
                    }
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setTypeDialogOptions((prev) => [...prev, ''])}
                >
                  <Plus className="mr-2 size-4" />
                  Option hinzufügen
                </Button>
              </div>
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button size="lg" variant="outline" onClick={() => setTypeDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                size="lg"
                onClick={commitTypeDialog}
                disabled={typeDialogOptions.every((o) => o.trim() === '')}
              >
                Übernehmen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {onDeleteSection && (
        <Dialog open={deleteSectionOpen} onOpenChange={setDeleteSectionOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Abschnitt löschen?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Sind Sie sicher, dass Sie den Abschnitt <strong>{section.title}</strong> löschen
              möchten? Folgende Felder werden ebenfalls gelöscht:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {section.fields.map((f) => (
                <Badge key={f.id} variant="outline" className="text-sm">
                  {f.label}
                </Badge>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                className="h-10"
                onClick={() => setDeleteSectionOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="h-10"
                onClick={() => {
                  setDeleteSectionOpen(false);
                  onDeleteSection();
                }}
              >
                Löschen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
