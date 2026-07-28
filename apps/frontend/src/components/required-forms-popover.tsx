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
import { FileCheck, FilePlus, FileText, Info, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';

export interface RequiredFormRef {
  form: RequiredForm;
  order: number;
}

interface RequiredFormsPopoverProps {
  requiredForms: RequiredFormRef[];
  availableForms: RequiredForm[];
  onChange: (formIds: string[]) => Promise<void>;
  isPending: boolean;
  disabled?: boolean;
  createNewHref: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  subtitle?: string;
  onOpenChange?: (open: boolean) => void;
}

function formHasFileUpload(form: RequiredForm): boolean {
  return (
    form.blockRefs?.some((ref) =>
      ref.block?.fields?.some(
        (field) => field.type === FieldType.DocumentAcknowledgement,
      ),
    ) ?? false
  );
}

export function RequiredFormsPopover({
  requiredForms,
  availableForms,
  onChange,
  isPending,
  disabled,
  createNewHref,
  t,
  subtitle,
  onOpenChange,
}: RequiredFormsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const effectiveEnabled = requiredForms.length > 0;

  const attachedFormIds = useMemo(
    () => new Set(requiredForms.map((ref) => ref.form.id)),
    [requiredForms],
  );

  const selectableForms = useMemo(
    () => availableForms.filter((form) => !attachedFormIds.has(form.id)),
    [availableForms, attachedFormIds],
  );

  const getFormDescription = (form: RequiredForm) => {
    const count = form.blockRefs?.length ?? 0;
    const hasUpload = formHasFileUpload(form);
    const questionLabel = t('questionCount', { count });
    return hasUpload
      ? `${questionLabel} · ${t('fileUploadLabel')}`
      : questionLabel;
  };

  const handleRemove = async (formId: string) => {
    const nextIds = requiredForms
      .filter((ref) => ref.form.id !== formId)
      .map((ref) => ref.form.id);
    await onChange(nextIds);
  };

  const handleAddExisting = async (formId: string) => {
    const nextIds = [...requiredForms.map((ref) => ref.form.id), formId];
    await onChange(nextIds);
    setCommandOpen(false);
  };

  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {effectiveEnabled
          ? t('pill.required', { count: requiredForms.length })
          : t('pill.none')}
      </Button>
    );
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <span
            className={`mr-2 inline-flex h-2 w-2 rounded-full ${effectiveEnabled ? 'bg-green-500' : 'bg-muted-foreground'}`}
          />
          {effectiveEnabled
            ? t('pill.required', { count: requiredForms.length })
            : t('pill.none')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] p-0" align="end">
        <div className="p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{t('title')}</h3>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          {requiredForms.length > 0 && (
            <div className="space-y-3">
              {requiredForms.map((ref) => (
                <div
                  key={ref.form.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {formHasFileUpload(ref.form) ? (
                      <FileCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ref.form.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFormDescription(ref.form)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemove(ref.form.id)}
                    disabled={isPending}
                    aria-label={t('removeAria', { name: ref.form.name })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Popover open={commandOpen} onOpenChange={setCommandOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary text-primary hover:bg-primary/5"
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
                      {selectableForms.map((form) => (
                        <CommandItem
                          key={form.id}
                          value={form.id}
                          onSelect={() => handleAddExisting(form.id)}
                        >
                          {form.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={createNewHref}>
                <FilePlus className="mr-2 h-4 w-4" />
                {t('createNew')}
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{t('dedupHint')}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
