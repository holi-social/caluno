'use client';

import { FieldType, type RequiredForm } from '@repo/data/react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { FileCheck, FileText, Info, X } from 'lucide-react';

type FormsT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export function formHasFileUpload(form: RequiredForm): boolean {
  return (
    form.blockRefs?.some((ref) =>
      ref.block?.fields?.some(
        (field) => field.type === FieldType.DocumentAcknowledgement,
      ),
    ) ?? false
  );
}

export function getRequiredFormDescription(
  form: RequiredForm,
  t: FormsT,
): string {
  const count = form.blockRefs?.length ?? 0;
  const questionLabel = t('questionCount', { count });
  return formHasFileUpload(form)
    ? `${questionLabel} · ${t('fileUploadLabel')}`
    : questionLabel;
}

interface RequiredFormsListProps {
  forms: RequiredForm[];
  onRemove: (formId: string) => void;
  removeDisabled?: boolean;
  t: FormsT;
}

export function RequiredFormsList({
  forms,
  onRemove,
  removeDisabled,
  t,
}: RequiredFormsListProps) {
  if (forms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {forms.map((form) => (
        <div
          key={form.id}
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            {formHasFileUpload(form) ? (
              <FileCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{form.name}</p>
              <p className="text-xs text-muted-foreground">
                {getRequiredFormDescription(form, t)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(form.id)}
            disabled={removeDisabled}
            aria-label={t('removeAria', { name: form.name })}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

interface RequiredFormsAddExistingProps {
  availableForms: RequiredForm[];
  onAdd: (formId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  t: FormsT;
}

export function RequiredFormsAddExisting({
  availableForms,
  onAdd,
  open,
  onOpenChange,
  disabled,
  t,
}: RequiredFormsAddExistingProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-primary text-primary hover:bg-primary/5"
          disabled={disabled}
        >
          {t('addExisting')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('searchForms')} />
          <CommandList>
            <CommandEmpty>{t('noFormsFound')}</CommandEmpty>
            <CommandGroup>
              {availableForms.map((form) => (
                <CommandItem
                  key={form.id}
                  value={form.id}
                  onSelect={() => onAdd(form.id)}
                >
                  {form.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function RequiredFormsDedupHint({ t }: { t: FormsT }) {
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <p>{t('dedupHint')}</p>
    </div>
  );
}
