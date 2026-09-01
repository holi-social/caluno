'use client';

import { useCheckInShifts } from '@repo/data/react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
} from '@repo/ui';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  type CheckInInstance,
  instancesOnDate,
} from '../../check-in-selection';
import { CheckInSheet } from './check-in-sheet';

type ShiftSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUnitId: string;
  instances: CheckInInstance[];
  selectedDate: Date | null;
  selectedShiftInstanceId: string | null;
  onSelectInstance: (instance: CheckInInstance) => void;
  onSelectShift: (shiftId: string) => void;
};

export function ShiftSheet({
  open,
  onOpenChange,
  orgUnitId,
  instances,
  selectedDate,
  selectedShiftInstanceId,
  onSelectInstance,
  onSelectShift,
}: ShiftSheetProps) {
  const t = useTranslations('CheckIn');
  const { formatTimeRange } = useFormatting();
  const [search, setSearch] = useState('');

  const dayInstances = selectedDate
    ? instancesOnDate(instances, selectedDate)
    : [];

  const normalizedSearch = search.trim().toLowerCase();
  const visibleDayInstances = dayInstances.filter((instance) =>
    instance.title.toLowerCase().includes(normalizedSearch),
  );

  const { data: matchingShifts } = useCheckInShifts(orgUnitId, search);

  // Shifts matching the typed name that do not run on the selected date.
  const dayShiftIds = new Set(dayInstances.map((i) => i.masterId));
  const otherDayShifts = (matchingShifts ?? []).filter(
    (shift) => !dayShiftIds.has(shift.id),
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearch('');
    }
    onOpenChange(next);
  };

  return (
    <CheckInSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t('shiftSheetTitle')}
      footer={
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => handleOpenChange(false)}
        >
          {t('saveSelection')}
        </Button>
      }
    >
      <Command
        forceShowInput
        shouldFilter={false}
        className="flex min-h-0 flex-1 flex-col"
      >
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder={t('shiftSearchPlaceholder')}
        />
        <CommandList className="max-h-none flex-1">
          {visibleDayInstances.length === 0 && otherDayShifts.length === 0 && (
            <CommandEmpty>{t('noShiftsFound')}</CommandEmpty>
          )}

          {visibleDayInstances.map((instance) => {
            const isSelected = instance.id === selectedShiftInstanceId;

            return (
              <CommandItem
                key={instance.id}
                value={instance.id}
                onSelect={() => {
                  onSelectInstance(instance);
                  handleOpenChange(false);
                }}
                className={cn(
                  'cursor-pointer justify-between',
                  isSelected && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {instance.title}
                  </span>
                  <span className="block text-muted-foreground">
                    {formatTimeRange(
                      instance.actualStartsAt,
                      instance.actualEndsAt,
                    )}
                  </span>
                </span>
                {isSelected && <Check className="size-4 shrink-0" />}
              </CommandItem>
            );
          })}

          {otherDayShifts.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('foundOnOtherDays')}
              </p>
              {otherDayShifts.map((shift) => (
                <CommandItem
                  key={shift.id}
                  value={shift.id}
                  onSelect={() => {
                    onSelectShift(shift.id);
                    handleOpenChange(false);
                  }}
                  className="cursor-pointer"
                >
                  {shift.title}
                </CommandItem>
              ))}
            </>
          )}
        </CommandList>
      </Command>
    </CheckInSheet>
  );
}
