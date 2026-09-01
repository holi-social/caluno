'use client';

import {
  Calendar,
  cn,
  FieldError,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
} from '@repo/ui';
import { startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';

export type RecurrenceEndMode = 'never' | 'on';

interface RecurrenceEndSelectProps {
  mode: RecurrenceEndMode;
  date: Date | undefined;
  minDate?: Date;
  error?: string;
  disabled?: boolean;
  onModeChange: (mode: RecurrenceEndMode) => void;
  onDateChange: (date: Date | undefined) => void;
}

function atTimeOf(date: Date, timeSource?: Date): Date {
  const next = new Date(date);
  if (timeSource) {
    next.setHours(
      timeSource.getHours(),
      timeSource.getMinutes(),
      timeSource.getSeconds(),
      0,
    );
  } else {
    next.setHours(23, 59, 59, 0);
  }
  return next;
}

export function RecurrenceEndSelect({
  mode,
  date,
  minDate,
  error,
  disabled = false,
  onModeChange,
  onDateChange,
}: RecurrenceEndSelectProps) {
  const t = useTranslations('Shift');
  const { formatDate } = useFormatting();
  const [open, setOpen] = useState(false);

  const interactive = !disabled;
  const dateLooksInactive = mode !== 'on';
  const minDay = minDate ? startOfDay(minDate) : undefined;

  const selectOnAndOpen = (nextOpen: boolean) => {
    if (!interactive) return;
    if (nextOpen && mode !== 'on') onModeChange('on');
    setOpen(nextOpen);
  };

  return (
    <FieldSet disabled={disabled} className="gap-3">
      <FieldLegend variant="label" id="recurrence-ends-legend">
        {t('form.recurrenceEnds')}
      </FieldLegend>

      <RadioGroup
        value={mode}
        onValueChange={(value) => onModeChange(value as RecurrenceEndMode)}
        disabled={disabled}
        aria-labelledby="recurrence-ends-legend"
        className="gap-1"
      >
        <div className="flex min-h-11 items-center gap-3">
          <RadioGroupItem value="never" id="recurrence-end-never" />
          <label
            htmlFor="recurrence-end-never"
            className="cursor-pointer text-sm font-normal leading-none"
          >
            {t('form.recurrenceEndsNever')}
          </label>
        </div>

        <div className="flex min-h-11 items-center gap-3">
          <RadioGroupItem value="on" id="recurrence-end-on" />
          <label
            htmlFor="recurrence-end-on"
            className="cursor-pointer shrink-0 text-sm font-normal leading-none"
          >
            {t('form.recurrenceEndsOn')}
          </label>

          <Popover
            open={interactive ? open : false}
            onOpenChange={selectOnAndOpen}
          >
            <PopoverTrigger asChild>
              <InputGroup
                data-disabled={!interactive}
                className={cn(
                  'min-w-0 flex-1',
                  interactive && 'cursor-pointer',
                  interactive && dateLooksInactive && 'opacity-50',
                )}
                aria-invalid={!!error}
                onPointerDown={() => {
                  if (interactive && mode !== 'on') onModeChange('on');
                }}
              >
                <InputGroupInput
                  id="recurrence-end-date"
                  readOnly
                  disabled={!interactive}
                  className={interactive ? 'cursor-pointer' : undefined}
                  value={date ? formatDate(date) : ''}
                  placeholder={t('form.recurrenceEndDatePlaceholder')}
                  aria-invalid={!!error}
                  aria-label={t('form.recurrenceEndDatePlaceholder')}
                />
                <InputGroupAddon align="inline-end">
                  <CalendarIcon />
                </InputGroupAddon>
              </InputGroup>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                defaultMonth={date ?? minDate}
                disabled={minDay ? { before: minDay } : undefined}
                onSelect={(selected) => {
                  if (!selected) return;
                  onDateChange(atTimeOf(selected, minDate));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </RadioGroup>

      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  );
}
