'use client';

import {
  Button,
  Calendar,
  FieldError,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { buildDateRangeDisabledMatcher } from './date-range-matcher';

export type Props = {
  disabled?: boolean;
  errors?: Array<string | undefined>;
  value: { start: Date | null; end: Date | null };
  onChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
};

const getTimeString = (date: Date | null | undefined): string => {
  if (!date) return '';
  return format(date, 'HH:mm');
};

const applyTimeToDate = (date: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
};

const applyDateToTime = (date: Date, timeOrigin: Date): Date => {
  const result = new Date(date);
  result.setHours(timeOrigin.getHours(), timeOrigin.getMinutes(), 0, 0);
  return result;
};

export const DatePickerWithTimeRange = ({
  value,
  onChange,
  disabled,
  errors = [],
  minDate,
  maxDate,
}: Props) => {
  const [pickedDate, setPickedDate] = useState<Date | null>(() =>
    value.start ? startOfDay(value.start) : null,
  );

  const calendarDate = value.start ? startOfDay(value.start) : pickedDate;

  const timeInputsDisabled = disabled || !calendarDate;

  const endBeforeStartError =
    value.start && value.end && value.end <= value.start
      ? 'End time must be later than start time'
      : null;

  const handleDateSelect = (date: Date | undefined) => {
    setPickedDate(date ? startOfDay(date) : null);

    // Reset start and end time when date is cleared
    if (!date) {
      onChange(null, null);
      return;
    }

    if (!value.start && !value.end) {
      const now = new Date();
      now.setSeconds(0, 0);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      onChange(
        applyTimeToDate(date, format(now, 'HH:mm')),
        applyTimeToDate(date, format(oneHourLater, 'HH:mm')),
      );
      return;
    }

    onChange(
      value.start ? applyDateToTime(date, value.start) : null,
      value.end ? applyDateToTime(date, value.end) : null,
    );
  };

  const handleStartTimeChange = (timeStr: string) => {
    if (!calendarDate) return;
    onChange(
      timeStr ? applyTimeToDate(calendarDate, timeStr) : null,
      value.end,
    );
  };

  const handleEndTimeChange = (timeStr: string) => {
    if (!calendarDate) return;
    onChange(
      value.start,
      timeStr ? applyTimeToDate(calendarDate, timeStr) : null,
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-start text-left font-normal rounded-md px-3 has-[>svg]:px-3"
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 size-4" />
              {calendarDate ? format(calendarDate, 'dd.MM.yyyy') : 'Date'}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={calendarDate ?? undefined}
              onSelect={handleDateSelect}
              weekStartsOn={1}
              disabled={buildDateRangeDisabledMatcher(minDate, maxDate)}
              startMonth={minDate}
              endMonth={maxDate}
            />
          </PopoverContent>
        </Popover>

        <Input
          type="time"
          className="w-28"
          value={getTimeString(value.start)}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          disabled={timeInputsDisabled}
        />

        <Input
          type="time"
          className="w-28"
          value={getTimeString(value.end)}
          onChange={(e) => handleEndTimeChange(e.target.value)}
          disabled={timeInputsDisabled}
        />
      </div>

      {errors.map((error) =>
        error ? <FieldError key={error}>{error}</FieldError> : null,
      )}
      {endBeforeStartError && <FieldError>{endBeforeStartError}</FieldError>}
    </div>
  );
};
