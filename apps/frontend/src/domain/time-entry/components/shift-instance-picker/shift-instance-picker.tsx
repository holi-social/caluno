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
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect } from 'react';
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

export function ShiftPicker({
  shifts,
  value,
  onChange,
  disabled,
}: ShiftPickerProps) {
  const t = useTranslations('TimeEntry');
  const formatter = useFormatter();
  const {
    data: instances,
    isLoading,
    isError,
  } = useShiftInstances(value.shiftId);

  const selectedShift = shifts.find((i) => i.id === value.shiftId);
  const selectedInstance = instances?.find(
    (i) => i.id === value.shiftInstanceId,
  );

  const shiftInstanceLabel = (shift: Shift, instance?: ShiftInstanceItem) => {
    if (instance) {
      const start = new Date(instance.actualStartsAt);
      const end = new Date(instance.actualEndsAt);
      return t('picker.shiftInstanceLabel', {
        title: shift.title,
        date: formatter.dateTime(start, { dateStyle: 'medium' }),
        startTime: formatter.dateTime(start, { timeStyle: 'short' }),
        endTime: formatter.dateTime(end, { timeStyle: 'short' }),
      });
    }
    return shiftLabel(shift);
  };

  const shiftLabel = (shift: Shift) => {
    const start = new Date(shift.originalStartsAt);
    const end = new Date(start.getTime() + shift.durationMinutes * 60000);
    return t('picker.shiftLabel', {
      title: shift.title,
      pattern: formatRrulePattern(shift.rrule),
      startTime: formatter.dateTime(start, { timeStyle: 'short' }),
      endTime: formatter.dateTime(end, { timeStyle: 'short' }),
    });
  };

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
        {t('form.selectShiftLabel')} <span className="text-destructive">*</span>
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
                ? shiftInstanceLabel(selectedShift, selectedInstance)
                : t('form.selectShiftPlaceholder')
            }
          />
        </SelectTrigger>
        <SelectContent>
          {shifts.map((shift) => (
            <SelectItem key={shift.id} value={shift.id}>
              {shiftLabel(shift)}
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
              {t('form.loadInstancesError')}
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
          {t('form.selectShiftHint')}
        </div>
      )}
    </Field>
  );
}
