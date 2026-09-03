'use client';

import { Calendar } from '@repo/ui';
import { useMemo } from 'react';
import type { CheckInInstance } from '../../check-in-selection';
import { CheckInDayButton } from './check-in-day-button';

type CheckInCalendarProps = {
  instances: CheckInInstance[];
  selectedDate: Date | null;
  selectedShiftId: string | null;
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
};

export function CheckInCalendar({
  instances,
  selectedDate,
  selectedShiftId,
  month,
  onMonthChange,
  onSelect,
}: CheckInCalendarProps) {
  const { anyDays, shiftDays } = useMemo(() => {
    const any = new Set<string>();
    const shift = new Set<string>();

    for (const instance of instances) {
      const key = new Date(instance.actualStartsAt).toDateString();
      any.add(key);
      if (selectedShiftId && instance.masterId === selectedShiftId) {
        shift.add(key);
      }
    }

    return { anyDays: any, shiftDays: shift };
  }, [instances, selectedShiftId]);

  return (
    <Calendar
      mode="single"
      className="w-full"
      month={month}
      onMonthChange={onMonthChange}
      selected={selectedDate ?? undefined}
      onSelect={(date) => {
        if (date) onSelect(date);
      }}
      showOutsideDays={false}
      modifiers={{
        hasInstance: (date) => anyDays.has(date.toDateString()),
        hasSelectedShift: (date) => shiftDays.has(date.toDateString()),
      }}
      components={{ DayButton: CheckInDayButton }}
    />
  );
}
