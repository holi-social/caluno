'use client';

import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { CircleHelpIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Signee, SigneeRole } from './types';

const ALL_ROLES: SigneeRole[] = [
  'volunteer',
  'coordinator',
  'hq_manager',
  'supervisor',
];

interface TemplateSigneeChainProps {
  signees: Signee[];
  onSigneesChange?: (signees: Signee[]) => void;
  className?: string;
}

export function TemplateSigneeChain({
  signees,
  onSigneesChange,
  className,
}: TemplateSigneeChainProps) {
  const t = useTranslations('Accounting.templates.card');
  const [pickerOpen, setPickerOpen] = useState(false);
  const addedRoles = new Set(signees.map((s) => s.role));
  const availableRoles = ALL_ROLES.filter((r) => !addedRoles.has(r));

  function addSignee(role: SigneeRole) {
    onSigneesChange?.([...signees, { id: crypto.randomUUID(), role }]);
    setPickerOpen(false);
  }

  function removeSignee(id: string) {
    onSigneesChange?.(signees.filter((s) => s.id !== id));
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('filled.signeesTitle')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelpIcon
              size={14}
              className="text-muted-foreground/50 shrink-0 cursor-help"
              aria-label={t('filled.signeesTooltip')}
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-60">
            {t('filled.signeesTooltip')}
          </TooltipContent>
        </Tooltip>
      </div>

      {signees.length > 0 && (
        <div className="relative flex flex-col gap-2 py-0.5">
          {signees.length > 1 && (
            <div
              className="absolute left-2.5 top-2.5 bottom-2.5 w-px bg-border"
              aria-hidden="true"
            />
          )}
          {signees.map((signee, index) => {
            const roleLabel =
              signee.orgRole?.name ??
              t(`signeeRoles.${signee.role}` as Parameters<typeof t>[0]);
            return (
              <div key={signee.id} className="flex items-center gap-2">
                <span
                  className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[11px] font-medium tabular-nums text-muted-foreground"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-sm text-foreground">
                  {roleLabel}
                  <button
                    type="button"
                    onClick={() => removeSignee(signee.id)}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={t('filled.removeSignee', {
                      role: roleLabel,
                    } as Parameters<typeof t>[1])}
                  >
                    <XIcon size={12} aria-hidden="true" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {availableRoles.length > 0 && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="md" className="gap-1.5">
              <PlusIcon size={14} aria-hidden="true" />
              {t('filled.addSignee')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <div className="flex flex-col">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => addSignee(role)}
                  className="flex items-center rounded px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                >
                  {t(`signeeRoles.${role}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
