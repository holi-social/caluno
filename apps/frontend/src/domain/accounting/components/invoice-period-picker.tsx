'use client';

import {
  Button,
  Calendar,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { format } from 'date-fns';
import { CalendarIcon, CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

function thisMonthRange(): DateRange {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function lastMonthRange(): DateRange {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    to: new Date(now.getFullYear(), now.getMonth(), 0),
  };
}

function matchesPreset(range: DateRange, preset: DateRange): boolean {
  return (
    range.from?.getTime() === preset.from?.getTime() &&
    range.to?.getTime() === preset.to?.getTime()
  );
}

interface PeriodPresetButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PeriodPresetButton({
  label,
  selected,
  onClick,
}: PeriodPresetButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        'flex-1 gap-1.5',
        selected &&
          'bg-foreground text-background border-foreground hover:bg-foreground/90',
      )}
      onClick={onClick}
    >
      {selected && <CheckIcon size={14} />}
      {label}
    </Button>
  );
}

interface InvoicePeriodPickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

/**
 * Mirrors the reimbursements board's own inline period-picker idiom (presets
 * + range calendar + Apply), staged locally so in-progress selection only
 * commits on Apply. Scoped to this modal — doesn't read or write the board's
 * own filter state. Unlike that filter, an invoice period always needs a
 * concrete start and end, so there's no "all time" preset here.
 */
export function InvoicePeriodPicker({
  value,
  onChange,
  className,
}: InvoicePeriodPickerProps) {
  const t = useTranslations(
    'Accounting.reimbursements.invoiceModal.periodPicker',
  );
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    value,
  );

  const buttonLabel =
    value.from && value.to
      ? `${format(value.from, 'dd.MM.yyyy')} – ${format(value.to, 'dd.MM.yyyy')}`
      : t('placeholder');

  function handleApply() {
    if (pendingRange?.from && pendingRange.to) {
      onChange({ from: pendingRange.from, to: pendingRange.to });
    }
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setPendingRange(value);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-10 justify-start gap-2', className)}
        >
          <CalendarIcon size={14} />
          {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[248px] p-0" align="start">
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <PeriodPresetButton
            label={t('thisMonth')}
            selected={
              !!pendingRange && matchesPreset(pendingRange, thisMonthRange())
            }
            onClick={() => setPendingRange(thisMonthRange())}
          />
          <PeriodPresetButton
            label={t('lastMonth')}
            selected={
              !!pendingRange && matchesPreset(pendingRange, lastMonthRange())
            }
            onClick={() => setPendingRange(lastMonthRange())}
          />
        </div>
        <Calendar
          mode="range"
          selected={pendingRange}
          onSelect={setPendingRange}
          captionLayout="dropdown"
          startMonth={new Date(2024, 0)}
          endMonth={new Date(2028, 11)}
        />
        <div className="border-t border-border p-3">
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={!pendingRange?.from || !pendingRange?.to}
            onClick={handleApply}
          >
            {t('apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
