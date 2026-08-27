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
import { useState } from 'react';

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

export interface PeriodPreset {
  key: string;
  label: string;
  /** `undefined` clears the range — used for an "all time" preset. */
  range: DateRange | undefined;
}

export function thisMonthRange(): DateRange {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

export function lastMonthRange(): DateRange {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    to: new Date(now.getFullYear(), now.getMonth(), 0),
  };
}

function matchesPreset(
  value: DateRange | undefined,
  preset: DateRange | undefined,
): boolean {
  if (!preset) return !value?.from;
  return (
    value?.from?.getTime() === preset.from?.getTime() &&
    value?.to?.getTime() === preset.to?.getTime()
  );
}

function formatRange(value: DateRange): string {
  if (!value.from) return '';
  if (!value.to) return format(value.from, 'dd.MM.yyyy');
  return `${format(value.from, 'dd.MM.yyyy')} – ${format(value.to, 'dd.MM.yyyy')}`;
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

interface PeriodPickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  presets: PeriodPreset[];
  placeholderLabel: string;
  applyLabel: string;
  /** Trigger text when the value doesn't match a preset. Defaults to the formatted "dd.MM.yyyy – dd.MM.yyyy" range. */
  customRangeLabel?: string;
  /** Selecting a preset commits and closes immediately instead of staging until Apply. */
  autoApplyPresets?: boolean;
  /** Whether Apply needs both a start and end date, or just a start. Default true. */
  requireEndDate?: boolean;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Preset buttons + range calendar + Apply, staged locally so an in-progress
 * selection only commits on Apply (or immediately per preset, with
 * `autoApplyPresets`). Shared by the reimbursements board's period filter and
 * the invoice creation modal's period field — same interaction, one
 * implementation.
 */
export function PeriodPicker({
  value,
  onChange,
  presets,
  placeholderLabel,
  applyLabel,
  customRangeLabel,
  autoApplyPresets = false,
  requireEndDate = true,
  align = 'start',
  className,
}: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    value,
  );

  const matchedPreset = presets.find((preset) =>
    matchesPreset(value, preset.range),
  );
  const buttonLabel = matchedPreset
    ? matchedPreset.label
    : value?.from
      ? (customRangeLabel ?? formatRange(value))
      : placeholderLabel;

  function handlePresetClick(preset: PeriodPreset) {
    if (autoApplyPresets) {
      onChange(preset.range);
      setOpen(false);
      return;
    }
    setPendingRange(preset.range);
  }

  function handleApply() {
    if (pendingRange?.from && (!requireEndDate || pendingRange.to)) {
      onChange(pendingRange);
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
      {/* Width pinned to the calendar's own rendered size (7 cols × --cell-size + p-3), not the default w-72 — otherwise the calendar sits flush-left in a wider box with dead space on the right. */}
      <PopoverContent className="w-[248px] p-0" align={align}>
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border p-3">
            {presets.map((preset) => (
              <PeriodPresetButton
                key={preset.key}
                label={preset.label}
                selected={matchesPreset(pendingRange, preset.range)}
                onClick={() => handlePresetClick(preset)}
              />
            ))}
          </div>
        )}
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
            disabled={
              !pendingRange?.from || (requireEndDate && !pendingRange.to)
            }
            onClick={handleApply}
          >
            {applyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
