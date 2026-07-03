'use client';

import { Button, cn, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import { ArrowRightIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type SigningRole = 'volunteer' | 'coordinator' | 'supervisor';

export interface SigningStep {
  id: string;
  role: SigningRole;
}

interface SigningChainEditableProps {
  steps: SigningStep[];
  editable?: boolean;
  onStepsChange?: (steps: SigningStep[]) => void;
  className?: string;
}

let nextId = 1;
function makeId() {
  return `step-${nextId++}`;
}

export function SigningChainEditable({
  steps,
  editable = false,
  onStepsChange,
  className,
}: SigningChainEditableProps) {
  const t = useTranslations('Accounting.settings.lifecycle.signingChain');
  const [pickerOpen, setPickerOpen] = useState(false);

  const ROLES: SigningRole[] = ['volunteer', 'coordinator', 'supervisor'];

  function addStep(role: SigningRole) {
    onStepsChange?.([...steps, { id: makeId(), role }]);
    setPickerOpen(false);
  }

  function removeStep(id: string) {
    onStepsChange?.(steps.filter((s) => s.id !== id));
  }

  if (steps.length === 0 && !editable) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('empty')}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-1">
          {index > 0 && (
            <ArrowRightIcon
              size={14}
              className="text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm',
              editable
                ? 'border-border bg-background'
                : 'border-muted-foreground/30 bg-muted',
            )}
          >
            {t(`roles.${step.role}` as Parameters<typeof t>[0])}
            {editable && (
              <button
                type="button"
                onClick={() => removeStep(step.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Remove ${t(`roles.${step.role}` as Parameters<typeof t>[0])}`}
              >
                <XIcon size={12} />
              </button>
            )}
          </span>
        </div>
      ))}

      {editable && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-sm text-muted-foreground"
            >
              <PlusIcon size={14} />
              {t('addStep')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            <div className="flex flex-col">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => addStep(role)}
                  className="flex items-center rounded px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                >
                  {t(`roles.${role}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
