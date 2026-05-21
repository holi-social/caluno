'use client';

import {
  formatRrulePattern,
  type GetShiftsQuery,
  type ShiftInstanceItem,
} from '@repo/data';
import { useShiftInstances } from '@repo/data/react';
import {
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatRange, formatTime } from '@/lib/formatting';
import { ShiftInstanceCalendar } from './shift-instance-picker/shift-instance-calendar';

export type PickerValue = {
  shiftId?: string;
  shiftInstanceId?: string;
};

type PickerStep = 'idle' | 'calendar' | 'selected';
type Shift = GetShiftsQuery['shifts']['items'][0];

interface ShiftPickerProps {
  shifts: Shift[];
  value: PickerValue;
  onChange: (value: PickerValue) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function ShiftPicker({
  shifts,
  value,
  onChange,
  onReset,
  disabled,
}: ShiftPickerProps) {
  const [step, setStep] = useState<PickerStep>(
    value.shiftInstanceId ? 'selected' : 'idle',
  );

  const {
    data: instances,
    isLoading,
    isError,
  } = useShiftInstances(value.shiftId);

  const selectedShift = shifts.find((i) => i.id === value.shiftId);
  const selectedInstance = instances?.find(
    (i) => i.id === value.shiftInstanceId,
  );

  const handleShiftSelect = useCallback(
    (shiftId: string) => {
      onChange({ shiftId });

      setStep('calendar');
    },
    [onChange],
  );

  // Auto-select for non-recurring shifts when instances load
  useEffect(() => {
    if (
      step === 'calendar' &&
      selectedShift &&
      !selectedShift.rrule &&
      instances &&
      instances.length > 0
    ) {
      const inst = instances[0]!;
      onChange({ shiftId: selectedShift.id, shiftInstanceId: inst.id });
      setStep('selected');
    }
  }, [step, selectedShift, instances, onChange]);

  const handleInstanceSelect = useCallback(
    (shiftInstanceId: string) => {
      onChange({ shiftId: value.shiftId, shiftInstanceId });
      setStep('selected');
    },
    [onChange, value],
  );

  const handleChange = useCallback(() => {
    setStep('idle');
    onReset();
  }, [onReset]);

  if (shifts.length === 0) {
    return (
      <Field>
        <FieldLabel>Select Shift</FieldLabel>
        <p className="text-sm text-muted-foreground">No shifts available</p>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel>
        Select Shift <span className="text-destructive">*</span>
      </FieldLabel>

      {/* Step: Selected summary */}
      {step === 'selected' && selectedInstance && selectedShift && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <p className="text-sm font-medium">{selectedShift.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatRange(
                selectedInstance.actualStartsAt,
                selectedInstance.actualEndsAt,
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleChange}
            disabled={disabled}
          >
            Change
          </Button>
        </div>
      )}

      {/* Step: Idle — pick a shift */}
      {step === 'idle' && (
        <Select
          value={selectedShift?.id ?? ''}
          onValueChange={handleShiftSelect}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((shift) => {
              const start = new Date(shift.originalStartsAt);
              const end = new Date(
                start.getTime() + shift.durationMinutes * 60000,
              );
              return (
                <SelectItem key={shift.id} value={shift.id}>
                  {shift.title}{' '}
                  <span className="text-muted-foreground">
                    {formatRrulePattern(shift.rrule)} · {formatTime(start)}–
                    {formatTime(end)}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

      {/* Step: Calendar — pick an instance */}
      {step === 'calendar' && (
        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange({ shiftId: undefined });
                setStep('idle');
              }}
              disabled={disabled}
            >
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
            <span className="text-sm font-medium">
              {getCalendarTitle(selectedShift)}
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              Failed to load instances. Please try again.
            </p>
          )}

          {instances && instances.length === 0 && !isLoading && (
            <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
              No scheduled instances
            </div>
          )}

          {instances && instances.length > 0 && !isLoading && selectedShift && (
            <ShiftInstanceCalendar
              instances={instances}
              selectedInstanceId={value.shiftInstanceId}
              onSelect={handleInstanceSelect}
              disabled={disabled}
            />
          )}
        </div>
      )}
    </Field>
  );
}

function getCalendarTitle(shift?: Shift): string {
  if (!shift) return '';

  const start = new Date(shift.originalStartsAt);
  const end = new Date(start.getTime() + shift.durationMinutes * 60000);
  return `${shift.title} — ${formatRrulePattern(shift.rrule)} ${formatTime(start)}–${formatTime(end)}`;
}
