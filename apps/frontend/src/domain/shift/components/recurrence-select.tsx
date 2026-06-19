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
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  getRecurrenceDays,
  getRecurrencePresets,
  type RecurrenceDayValue,
  type RecurrencePresetValue,
} from '../constants';

interface RecurrenceSelectProps {
  value: string[] | undefined;
  onChange: (days: string[]) => void;
  disabled?: boolean;
}

function getPresetFromDays(
  presets: { value: RecurrencePresetValue; days: string[] }[],
  days: string[],
): RecurrencePresetValue {
  if (!days || days.length === 0) return 'none';

  for (const preset of presets) {
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
  const t = useTranslations('Shift');

  const presets = useMemo(
    () =>
      getRecurrencePresets({
        none: t('recurrence.preset.none'),
        daily: t('recurrence.preset.daily'),
        workingDays: t('recurrence.preset.workingDays'),
        weekend: t('recurrence.preset.weekend'),
        custom: t('recurrence.preset.custom'),
      }),
    [t],
  );
  const days = useMemo(() => getRecurrenceDays(t), [t]);

  const detectedPreset = useMemo(
    () => getPresetFromDays(presets, value),
    [presets, value],
  );
  const [selectedPreset, setSelectedPreset] =
    useState<RecurrencePresetValue>(detectedPreset);

  const showDayPicker =
    selectedPreset === 'custom' ||
    (selectedPreset !== 'none' && value.length > 0);

  const handlePresetChange = (presetValue: string) => {
    const preset = presets.find((p) => p.value === presetValue);
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
        <FieldLabel>{t('form.recurring')}</FieldLabel>
        <Select
          value={selectedPreset}
          onValueChange={handlePresetChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('form.noRecurrence')} />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {showDayPicker && (
        <div>
          <FieldLabel className="mb-2">{t('form.chooseDays')}</FieldLabel>
          <div className="flex gap-1">
            {days.map((day) => (
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
