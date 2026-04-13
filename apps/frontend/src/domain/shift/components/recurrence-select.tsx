'use client';

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
import { useMemo, useState } from 'react';
import {
  RECURRENCE_DAYS,
  RECURRENCE_PRESETS,
  type RecurrenceDayValue,
  type RecurrencePresetValue,
} from '../constants';

interface RecurrenceSelectProps {
  value: string[] | undefined;
  onChange: (days: string[]) => void;
  disabled?: boolean;
}

function getPresetFromDays(days: string[]): RecurrencePresetValue {
  if (!days || days.length === 0) return 'none';

  for (const preset of RECURRENCE_PRESETS) {
    if (preset.value === 'none' || preset.value === 'custom') continue;
    if (
      preset.days.length === days.length &&
      preset.days.every((d) => days.includes(d))
    ) {
      return preset.value;
    }
  }
  return 'custom';
}

export function RecurrenceSelect({
  value = [],
  onChange,
  disabled = false,
}: RecurrenceSelectProps) {
  const detectedPreset = useMemo(() => getPresetFromDays(value), [value]);
  const [selectedPreset, setSelectedPreset] =
    useState<RecurrencePresetValue>(detectedPreset);

  const showDayPicker =
    selectedPreset === 'custom' ||
    (selectedPreset !== 'none' && value.length > 0);

  const handlePresetChange = (presetValue: string) => {
    const preset = RECURRENCE_PRESETS.find((p) => p.value === presetValue);
    if (!preset) return;

    setSelectedPreset(preset.value);

    if (preset.value === 'custom') {
      return;
    }

    onChange([...preset.days]);
  };

  const toggleDay = (day: RecurrenceDayValue) => {
    setSelectedPreset('custom');
    const newDays = value.includes(day)
      ? value.filter((d) => d !== day)
      : [...value, day];
    onChange(newDays);
  };

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>Recurring shift</FieldLabel>
        <Select
          value={selectedPreset}
          onValueChange={handlePresetChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="No recurrence" />
          </SelectTrigger>
          <SelectContent>
            {RECURRENCE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {showDayPicker && (
        <div>
          <FieldLabel className="mb-2">
            Choose which days this shift repeats
          </FieldLabel>
          <div className="flex gap-1">
            {RECURRENCE_DAYS.map((day) => (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant="outline"
                className={`min-w-9 ${value.includes(day.value) ? '!bg-foreground !text-background !border-foreground hover:!bg-foreground/90 hover:!text-background' : ''}`}
                onClick={() => toggleDay(day.value)}
                disabled={disabled}
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
