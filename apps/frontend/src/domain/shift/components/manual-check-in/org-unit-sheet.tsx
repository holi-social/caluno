'use client';

import { cn } from '@repo/ui';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CheckInSheet } from './check-in-sheet';

type OrgUnitSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUnits: Array<{ id: string; name: string }>;
  selectedOrgUnitId: string;
  onSelect: (orgUnitId: string) => void;
};

export function OrgUnitSheet({
  open,
  onOpenChange,
  orgUnits,
  selectedOrgUnitId,
  onSelect,
}: OrgUnitSheetProps) {
  const t = useTranslations('CheckIn');

  return (
    <CheckInSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('orgUnitSheetTitle')}
    >
      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {orgUnits.map((unit) => {
          const isSelected = unit.id === selectedOrgUnitId;

          return (
            <li key={unit.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(unit.id);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-3 text-left',
                  isSelected && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="min-w-0 truncate">{unit.name}</span>
                {isSelected && <Check className="size-4 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    </CheckInSheet>
  );
}
