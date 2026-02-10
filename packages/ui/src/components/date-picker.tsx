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
  formatter?: (date: Date) => string;
  'aria-invalid'?: boolean;
}

export function DatePickerWithRange({
  id,
  value: dateRange,
  onChange,
  formatter = (date: Date) => format(date, 'LLL dd, y'),
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
                  ? `${formatter(dateRange.from)} - ${formatter(dateRange.to)}`
                  : formatter(dateRange.from)
                : 'Pick a date'
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
