'use client';

import { useTimeEntryShiftInstances } from '@repo/data/react';
import {
  Calendar,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { endOfMonth, startOfMonth } from 'date-fns';
import { CalendarIcon, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  filterByTitle,
  instancesOnDate,
  sortByStartsAt,
  type TimeEntryShiftInstance,
  toTimeEntryShiftInstance,
} from '../../shift-instance-options';

export type PickerValue = {
  shiftId?: string;
  shiftInstanceId?: string;
};

type ShiftPickerProps = {
  value: PickerValue;
  onChange: (
    value: PickerValue,
    shiftInstance?: TimeEntryShiftInstance,
  ) => void;
  disabled?: boolean;
  /** Seeds the date filter (an existing entry's date when editing). */
  defaultDate?: Date | null;
};

export function ShiftPicker({
  value,
  onChange,
  disabled,
  defaultDate,
}: ShiftPickerProps) {
  const t = useTranslations('TimeEntry');
  const { formatDate, formatRange } = useFormatting();

  // The admin already knows the day they want to record, so the picker is
  // date-first: choose a day, then the occurrence(s) that run on it.
  const [date, setDate] = useState(() => defaultDate ?? new Date());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (defaultDate) setDate(defaultDate);
  }, [defaultDate]);

  const range = useMemo(
    () => ({ start: startOfMonth(date), end: endOfMonth(date) }),
    [date],
  );

  const {
    data: rawInstances,
    isLoading,
    isError,
  } = useTimeEntryShiftInstances(range.start, range.end);

  const dayInstances = useMemo(() => {
    const all = (rawInstances ?? []).map(toTimeEntryShiftInstance);
    return sortByStartsAt(instancesOnDate(all, date));
  }, [rawInstances, date]);

  const visibleInstances = useMemo(
    () => filterByTitle(dayInstances, search),
    [dayInstances, search],
  );

  const selectedInstance = dayInstances.find(
    (i) => i.id === value.shiftInstanceId,
  );

  const handleInstanceSelect = (instance: TimeEntryShiftInstance) => {
    onChange(
      { shiftId: instance.masterId, shiftInstanceId: instance.id },
      instance,
    );
  };

  return (
    <Field>
      <FieldLabel htmlFor="time-entry-shift-date">
        {t('form.selectShiftLabel')} <span className="text-destructive">*</span>
      </FieldLabel>

      <Popover>
        <PopoverTrigger asChild>
          <InputGroup data-disabled={disabled}>
            <InputGroupInput
              id="time-entry-shift-date"
              disabled={disabled}
              readOnly
              value={date ? formatDate(date) : t('form.shiftDatePlaceholder')}
            />
            <InputGroupAddon align="inline-start">
              <CalendarIcon />
            </InputGroupAddon>
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            defaultMonth={date}
            selected={date}
            onSelect={(next) => {
              if (next) setDate(next);
            }}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      <div className="mt-2 rounded-md border">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="px-3 py-2 text-sm text-destructive">
            {t('form.loadInstancesError')}
          </p>
        )}

        {!isLoading && !isError && (
          <Command
            forceShowInput
            shouldFilter={false}
            className="flex min-h-0 flex-col"
          >
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={t('form.shiftSearchPlaceholder')}
              disabled={disabled}
            />

            <CommandList className="max-h-56 overflow-auto">
              {visibleInstances.length === 0 && (
                <CommandEmpty>
                  {search
                    ? t('form.noShiftsMatching')
                    : t('form.noShiftsOnDay')}
                </CommandEmpty>
              )}

              {visibleInstances.map((instance) => {
                const isSelected = instance.id === value.shiftInstanceId;
                return (
                  <CommandItem
                    key={instance.id}
                    value={instance.id}
                    onSelect={() => {
                      if (disabled) return;
                      handleInstanceSelect(instance);
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
                        {formatRange(
                          instance.actualStartsAt,
                          instance.actualEndsAt,
                        )}
                      </span>
                    </span>
                    {isSelected && <Check className="size-4 shrink-0" />}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        )}
      </div>

      {selectedInstance && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t('form.selectedShiftInstanceLabel', {
            title: selectedInstance.title,
            range: formatRange(
              selectedInstance.actualStartsAt,
              selectedInstance.actualEndsAt,
            ),
          })}
        </p>
      )}
    </Field>
  );
}
