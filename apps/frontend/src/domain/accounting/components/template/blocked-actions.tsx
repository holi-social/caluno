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
import type { BlockedAction, GatePoint, TemplateSlug } from './types';

const ALL_GATES: GatePoint[] = [
  'check_in',
  'shift_signup',
  'document_ep_contract',
  'document_ep_invoice',
  'document_ul_contract',
  'document_ul_invoice',
];

const SLUG_TO_SELF_GATE: Record<TemplateSlug, GatePoint> = {
  'ehrenamtspauschale-contract': 'document_ep_contract',
  'ehrenamtspauschale-invoice': 'document_ep_invoice',
  'uebungsleiterpauschale-contract': 'document_ul_contract',
  'uebungsleiterpauschale-invoice': 'document_ul_invoice',
};

interface TemplateBlockedActionsProps {
  slug: TemplateSlug;
  actions: BlockedAction[];
  onActionsChange?: (actions: BlockedAction[]) => void;
  className?: string;
}

export function TemplateBlockedActions({
  slug,
  actions,
  onActionsChange,
  className,
}: TemplateBlockedActionsProps) {
  const t = useTranslations('Accounting.templates.card');
  const [pickerOpen, setPickerOpen] = useState(false);
  const addedGates = new Set(actions.map((a) => a.gate));
  const availableGates = ALL_GATES.filter(
    (g) => g !== SLUG_TO_SELF_GATE[slug] && !addedGates.has(g),
  );

  function addAction(gate: GatePoint) {
    onActionsChange?.([...actions, { id: crypto.randomUUID(), gate }]);
    setPickerOpen(false);
  }

  function removeAction(id: string) {
    onActionsChange?.(actions.filter((a) => a.id !== id));
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('filled.blockedActionsTitle')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelpIcon
              size={14}
              className="text-muted-foreground/60 shrink-0 cursor-help"
              aria-label={t('filled.blockedActionsTooltip')}
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-60">
            {t('filled.blockedActionsTooltip')}
          </TooltipContent>
        </Tooltip>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
              const gateLabel = t(
                `gatePoints.${action.gate}` as Parameters<typeof t>[0],
              );
              return (
                <span
                  key={action.id}
                  className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-sm text-foreground"
                >
                  {gateLabel}
                  <button
                    type="button"
                    onClick={() => removeAction(action.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={t('filled.removeAction', {
                      gate: gateLabel,
                    } as Parameters<typeof t>[1])}
                  >
                    <XIcon size={12} aria-hidden="true" />
                  </button>
                </span>
              );
            })}
        </div>
      )}

      {availableGates.length > 0 && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="gap-1.5"
            >
              <PlusIcon size={14} aria-hidden="true" />
              {t('filled.addBlockedAction')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="start">
            <div className="flex flex-col">
              {availableGates.map((gate) => (
                <button
                  key={gate}
                  type="button"
                  onClick={() => addAction(gate)}
                  className="flex items-center rounded px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                >
                  {t(`gatePoints.${gate}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
