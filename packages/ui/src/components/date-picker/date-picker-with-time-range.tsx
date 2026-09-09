'use client';

import {
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { FieldError, FieldWarning } from '../base/field';
import { buildDateRangeDisabledMatcher } from './date-range-matcher';
import {
  applyTimeToDate,
  classifyTimeRange,
  resolveTimeRangeOnDate,
} from './time-range';

export type DatePickerWithTimeRangeMessages = {
  endMustBeLaterThanStart?: string;
  continuesIntoNextDay?: string;
  shorterThan24Hours?: string;
};

export type Props = {
  disabled?: boolean;
  errors?: Array<string | undefined>;
  value: { start: Date | null; end: Date | null };
  onChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  allowOvernight?: boolean;
  messages?: DatePickerWithTimeRangeMessages;
};

const getTimeString = (date: Date | null | undefined): string => {
  if (!date) return '';
  return format(date, 'HH:mm');
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
  allowOvernight = false,
  messages = {},
}: Props) => {
  const [pickedDate, setPickedDate] = useState<Date | null>(() =>
    value.start ? startOfDay(value.start) : null,
  );

  const calendarDate = value.start ? startOfDay(value.start) : pickedDate;

  const timeInputsDisabled = disabled || !calendarDate;

  const kind =
    value.start && value.end ? classifyTimeRange(value.start, value.end) : 'ok';

  const endMustBeLaterThanStart =
    messages.endMustBeLaterThanStart ??
    'End time must be later than start time';
  const continuesIntoNextDay = messages.continuesIntoNextDay;
  const shorterThan24Hours = messages.shorterThan24Hours;

  const emitResolved = (startTime: string, endTime: string) => {
    if (!calendarDate) return;
    const { start, end } = resolveTimeRangeOnDate(
      calendarDate,
      startTime,
      endTime,
      { allowOvernight },
    );
    onChange(start, end);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setPickedDate(date ? startOfDay(date) : null);

    if (!date) {
      onChange(null, null);
      return;
    }

    if (!value.start && !value.end) {
      const now = new Date();
      now.setSeconds(0, 0);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const { start, end } = resolveTimeRangeOnDate(
        date,
        format(now, 'HH:mm'),
        format(oneHourLater, 'HH:mm'),
        { allowOvernight },
      );
      onChange(start, end);
      return;
    }

    const startTime = value.start ? format(value.start, 'HH:mm') : undefined;
    const endTime = value.end ? format(value.end, 'HH:mm') : undefined;
    if (startTime && endTime) {
      const { start, end } = resolveTimeRangeOnDate(date, startTime, endTime, {
        allowOvernight,
      });
      onChange(start, end);
      return;
    }

    onChange(
      value.start ? applyDateToTime(date, value.start) : null,
      value.end ? applyDateToTime(date, value.end) : null,
    );
  };

  const handleStartTimeChange = (timeStr: string) => {
    if (!calendarDate) return;
    if (!timeStr) {
      onChange(null, value.end);
      return;
    }
    const endTime = getTimeString(value.end);
    if (!endTime) {
      onChange(applyTimeToDate(calendarDate, timeStr), value.end);
      return;
    }
    emitResolved(timeStr, endTime);
  };

  const handleEndTimeChange = (timeStr: string) => {
    if (!calendarDate) return;
    if (!timeStr) {
      onChange(value.start, null);
      return;
    }
    const startTime = getTimeString(value.start);
    if (!startTime) {
      onChange(value.start, applyTimeToDate(calendarDate, timeStr));
      return;
    }
    emitResolved(startTime, timeStr);
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
      {kind === 'endNotAfterStart' && !errors.some(Boolean) && (
        <FieldError>{endMustBeLaterThanStart}</FieldError>
      )}
      {kind === 'tooLong' && !errors.some(Boolean) && shorterThan24Hours && (
        <FieldError>{shorterThan24Hours}</FieldError>
      )}
      {kind === 'overnight' && allowOvernight && continuesIntoNextDay && (
        <FieldWarning>{continuesIntoNextDay}</FieldWarning>
      )}
    </div>
  );
};
