'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Field, FieldError, FieldLabel } from './base/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from './base/input-group';
import { Popover, PopoverContent, PopoverTrigger } from './base/popover';
import { Calendar } from './calendar';

interface Props {
  names?: { startsAt?: string; endsAt?: string };
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  errors?: Array<{ message?: string } | undefined>;
  formatter?: (date: Date) => string;
}

export function DatePickerWithRange({
  names,
  dateRange,
  setDateRange,
  errors,
  formatter = (date: Date) => format(date, 'LLL dd, y'),
}: Props) {
  return (
    <>
      {/* Hidden fields for server action */}
      <input
        type="hidden"
        name={names?.startsAt ?? 'startsAt'}
        defaultValue={dateRange?.from?.toISOString()}
      />
      <input
        type="hidden"
        name={names?.endsAt ?? 'endsAt'}
        defaultValue={dateRange?.to?.toISOString()}
      />

      <Field>
        <FieldLabel htmlFor="date-picker-range">Date Picker Range</FieldLabel>
        <Popover>
          <PopoverTrigger asChild>
            <InputGroup>
              <InputGroupInput
                placeholder={
                  dateRange?.from
                    ? dateRange.to
                      ? `${formatter(dateRange.from)} - ${formatter(dateRange.to)}`
                      : formatter(dateRange.from)
                    : 'Pick a date'
                }
                aria-invalid={!!errors?.length}
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
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <FieldError errors={errors} />
      </Field>
    </>
  );
}
