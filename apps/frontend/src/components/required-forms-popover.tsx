'use client';

import type { RequiredForm } from '@repo/data/react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import { FilePlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  RequiredFormsAddExisting,
  RequiredFormsDedupHint,
  RequiredFormsList,
} from './required-forms-fields';

export interface RequiredFormRef {
  form: RequiredForm;
  order: number;
}

interface RequiredFormsPopoverProps {
  requiredForms: RequiredFormRef[];
  availableForms: RequiredForm[];
  onChange: (formIds: string[]) => Promise<boolean>;
  isPending: boolean;
  disabled?: boolean;
  disabledFormIds?: Set<string>;
  createNewHref: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  subtitle?: string;
  onOpenChange?: (open: boolean) => void;
  size?: React.ComponentProps<typeof Button>['size'];
}

export function RequiredFormsPopover({
  requiredForms,
  availableForms,
  onChange,
  isPending,
  disabled,
  disabledFormIds,
  createNewHref,
  t,
  subtitle,
  onOpenChange,
  size,
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

  const handleRemove = async (formId: string) => {
    const nextIds = requiredForms
      .filter((ref) => ref.form.id !== formId)
      .map((ref) => ref.form.id);
    await onChange(nextIds);
  };

  const handleAddExisting = async (formId: string) => {
    const nextIds = [...requiredForms.map((ref) => ref.form.id), formId];
    const success = await onChange(nextIds);
    if (success) {
      setCommandOpen(false);
    }
  };

  if (disabled) {
    return (
      <Button variant="outline" size={size} disabled>
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
        <Button variant="outline" size={size}>
          <span
            className={`inline-flex h-2 w-2 shrink-0 rounded-full ${effectiveEnabled ? 'bg-green-500' : 'bg-muted-foreground'}`}
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

          <RequiredFormsList
            forms={requiredForms.map((ref) => ref.form)}
            onRemove={handleRemove}
            removeDisabled={isPending}
            t={t}
          />

          <div className="flex items-center gap-3">
            <RequiredFormsAddExisting
              availableForms={selectableForms}
              onAdd={handleAddExisting}
              open={commandOpen}
              onOpenChange={setCommandOpen}
              disabledFormIds={disabledFormIds}
              t={t}
            />

            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={createNewHref}>
                <FilePlus className="mr-2 h-4 w-4" />
                {t('createNew')}
              </Link>
            </Button>
          </div>

          <RequiredFormsDedupHint t={t} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
