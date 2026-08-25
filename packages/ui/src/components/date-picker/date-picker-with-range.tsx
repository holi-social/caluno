'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { FieldError, FieldLabel } from '../base/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../base/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '../base/popover';
import { Calendar } from '../calendar';
import { Input } from '../input';

type Props = {
  id?: string;
  disabled?: boolean;
  errors?: Array<string | undefined>;
  value: { start: Date | null; end: Date | null };
  onChange: (start: Date | null, end: Date | null) => void;
  placeholder?: string;
  includeTime?: boolean;
};

const addTimePart = (date: Date, timePart: string): Date => {
  const parts = timePart.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;

  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

export function DatePickerWithRange({
  id,
  value,
  onChange,
  placeholder = 'Pick a date range',
  includeTime = false,
  disabled = false,
  errors = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [times, setTimes] = useState<{ start: string; end: string }>({
    start: value.start ? format(value.start, 'HH:mm') : '00:00',
    end: value.end ? format(value.end, 'HH:mm') : '23:59',
  });
  const formatString = includeTime ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy';

  const dateRange: DateRange | undefined =
    value.start || value.end
      ? { from: value.start ?? undefined, to: value.end ?? undefined }
      : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onChange(
      range?.from ? addTimePart(range.from, times.start) : null,
      range?.to ? addTimePart(range.to, times.end) : null,
    );
  };

  const handleFromTimeChange = (fromTime: string) => {
    setTimes({ ...times, start: fromTime });
    if (value.start) {
      onChange(addTimePart(value.start, fromTime), value.end);
    }
  };

  const handleToTimeChange = (toTime: string) => {
    setTimes({ ...times, end: toTime });
    if (value.end) {
      onChange(value.start, addTimePart(value.end, toTime));
    }
  };

  return (
    <div>
      <Popover
        open={disabled ? false : open}
        onOpenChange={(next) => !disabled && setOpen(next)}
      >
        <PopoverTrigger asChild>
          <InputGroup data-disabled={disabled}>
            <InputGroupInput
              id={id}
              disabled={disabled}
              placeholder={
                value.start
                  ? value.end
                    ? `${format(value.start, formatString)} - ${format(value.end, formatString)}`
                    : format(value.start, formatString)
                  : placeholder
              }
              aria-invalid={errors.some(Boolean)}
            />

            <InputGroupAddon align="inline-start">
              <CalendarIcon />
            </InputGroupAddon>
          </InputGroup>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value.start ?? undefined}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          {includeTime && (
            <div className="border-t p-3 flex gap-4">
              <div className="flex items-center gap-2 grow">
                <FieldLabel htmlFor={`${id}-from-time`}>From:</FieldLabel>
                <Input
                  id={`${id}-from-time`}
                  type="time"
                  value={
                    value.start ? format(value.start, 'HH:mm') : times.start
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFromTimeChange(e.target.value)
                  }
                  disabled={disabled}
                  className=""
                />
              </div>
              <div className="flex items-center gap-2 grow">
                <FieldLabel htmlFor={`${id}-to-time`}>To:</FieldLabel>
                <Input
                  id={`${id}-to-time`}
                  type="time"
                  value={value.end ? format(value.end, 'HH:mm') : times.end}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleToTimeChange(e.target.value)
                  }
                  disabled={disabled}
                  className=""
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {errors.map((error) =>
        error ? <FieldError key={error}>{error}</FieldError> : null,
      )}
    </div>
  );
}
