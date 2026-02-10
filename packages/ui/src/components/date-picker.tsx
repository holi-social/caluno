'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from './base/input-group';
import { Popover, PopoverContent, PopoverTrigger } from './base/popover';
import { Calendar } from './calendar';

interface Props {
  id?: string;
  value: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  formatString?: string;
  'aria-invalid'?: boolean;
}

export function DatePickerWithRange({
  id,
  value: dateRange,
  onChange,
  placeholder = 'Pick a date range',
  formatString = 'd. MMM yyyy',
  'aria-invalid': ariaInvalid,
}: Props) {
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
      </PopoverContent>
    </Popover>
  );
}
