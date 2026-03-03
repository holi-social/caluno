'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { FieldLabel } from './base/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from './base/input-group';
import { Popover, PopoverContent, PopoverTrigger } from './base/popover';
import { Calendar } from './calendar';
import { Input } from './input';

interface Props {
  id?: string;
  value: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  'aria-invalid'?: boolean;
  includeTime?: boolean;
}

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
  value: dateRange,
  onChange,
  placeholder = 'Pick a date range',
  'aria-invalid': ariaInvalid,
  includeTime = false,
}: Props) {
  const formatString = includeTime ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy HH:mm';

  const handleFromTimeChange = (fromTime: string) => {
    if (dateRange?.from) {
      onChange({ ...dateRange, from: addTimePart(dateRange.from, fromTime) });
    }
  };

  const handleToTimeChange = (toTime: string) => {
    if (dateRange?.to) {
      onChange({ ...dateRange, to: addTimePart(dateRange.to, toTime) });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <InputGroup>
          <InputGroupInput
            id={id}
            placeholder={
              dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, formatString)} - ${format(dateRange.to, formatString)}`
                  : format(dateRange.from, formatString)
                : placeholder
            }
            aria-invalid={ariaInvalid}
          />

          <InputGroupAddon align="inline-start">
            <CalendarIcon />
          </InputGroupAddon>
        </InputGroup>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onChange}
          numberOfMonths={2}
        />
        {includeTime && (
          <div className="border-t p-3 flex gap-4">
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor={`${id}-from-time`}>From:</FieldLabel>
              <Input
                id={`${id}-from-time`}
                type="time"
                value={dateRange?.from && format(dateRange.from, 'HH:mm')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFromTimeChange(e.target.value)
                }
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor={`${id}-to-time`}>To:</FieldLabel>
              <Input
                id={`${id}-to-time`}
                type="time"
                value={dateRange?.to && format(dateRange.to, 'HH:mm')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToTimeChange(e.target.value)
                }
                className="w-20"
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
