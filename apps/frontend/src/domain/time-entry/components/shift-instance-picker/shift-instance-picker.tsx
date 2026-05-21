'use client';

import {
  formatRrulePattern,
  type GetShiftsQuery,
  type ShiftInstanceItem,
} from '@repo/data';
import { useShiftInstances } from '@repo/data/react';
import {
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { formatDate, formatTime } from '@/lib/formatting';
import { ShiftInstanceCalendar } from './shift-instance-calendar';

export type PickerValue = {
  shiftId?: string;
  shiftInstanceId?: string;
};

type Shift = GetShiftsQuery['shifts']['items'][0];

type ShiftPickerProps = {
  shifts: Shift[];
  value: PickerValue;
  onChange: (value: PickerValue, shiftInstance?: ShiftInstanceItem) => void;
  disabled?: boolean;
};

const shiftLabel = (
  shift: Shift,
  instance?: { actualStartsAt: string; actualEndsAt: string },
) => {
  const label = getShiftOptionLabel(shift);
  if (!instance) return label;
  return `${label} · ${formatDate(new Date(instance.actualStartsAt))}`;
};

const getShiftOptionLabel = (shift: Shift) => {
  const start = new Date(shift.originalStartsAt);
  const end = new Date(start.getTime() + shift.durationMinutes * 60000);
  return `${shift.title} · ${formatRrulePattern(shift.rrule)}  ${formatTime(start)}–${formatTime(end)}`;
};

export function ShiftPicker({
  shifts,
  value,
  onChange,
  disabled,
}: ShiftPickerProps) {
  const {
    data: instances,
    isLoading,
    isError,
  } = useShiftInstances(value.shiftId);

  const selectedShift = shifts.find((i) => i.id === value.shiftId);
  const selectedInstance = instances?.find(
    (i) => i.id === value.shiftInstanceId,
  );

  // Auto-select non-recurring shifts, as there's only 1 instance and so no choice to be made
  useEffect(() => {
    if (
      !value.shiftInstanceId &&
      selectedShift &&
      !selectedShift.rrule &&
      instances &&
      instances.length > 0
    ) {
      onChange(
        {
          shiftId: selectedShift.id,
          shiftInstanceId: instances[0]?.id,
        },
        instances[0],
      );
    }
  }, [selectedShift, instances, onChange, value.shiftInstanceId]);

  const handleShiftSelect = (shiftId: string) => {
    onChange({ shiftId });
  };

  const handleInstanceSelect = (shiftInstanceId: string) => {
    const instance = instances?.find((i) => i.id === shiftInstanceId);
    onChange({ shiftId: value.shiftId, shiftInstanceId }, instance);
  };

  return (
    <Field>
      <FieldLabel>
        Select Shift <span className="text-destructive">*</span>
      </FieldLabel>

      <Select
        value={value.shiftId}
        onValueChange={handleShiftSelect}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              selectedShift
                ? shiftLabel(selectedShift, selectedInstance)
                : 'Select a shift'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {shifts.map((shift) => (
            <SelectItem key={shift.id} value={shift.id}>
              {getShiftOptionLabel(shift)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Calendar area */}
      {value.shiftId ? (
        <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {isLoading && (
            <div className="flex items-center justify-center py-8 rounded-md border">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive mt-1">
              Failed to load instances.
            </p>
          )}

          {instances && !isLoading && (
            <ShiftInstanceCalendar
              instances={instances}
              selectedInstanceId={value.shiftInstanceId}
              onSelect={handleInstanceSelect}
              disabled={disabled}
            />
          )}
        </div>
      ) : (
        <div className="mt-2 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Select a shift to view available dates
        </div>
      )}
    </Field>
  );
}
