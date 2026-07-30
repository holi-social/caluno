import {
  ALL_RECURRENCE_DAYS,
  getPresetFromDays,
  type RecurrenceDayValue,
  type RecurrencePresetValue,
} from './constants';

export type ShiftCreatedRecurrenceBadge =
  | {
      kind: 'preset';
      translationKey: 'oneTime' | 'daily' | 'workingDays' | 'weekend';
    }
  | { kind: 'custom'; days: RecurrenceDayValue[] };

const PRESET_TRANSLATION_KEYS: Record<
  Exclude<RecurrencePresetValue, 'custom'>,
  'oneTime' | 'daily' | 'workingDays' | 'weekend'
> = {
  none: 'oneTime',
  daily: 'daily',
  'working-days': 'workingDays',
  weekend: 'weekend',
};

export function resolveShiftCreatedRecurrenceBadge(
  recurrenceDays: RecurrenceDayValue[],
): ShiftCreatedRecurrenceBadge {
  const preset = getPresetFromDays(recurrenceDays);

  if (preset === 'custom') {
    return {
      kind: 'custom',
      days: ALL_RECURRENCE_DAYS.filter((day) => recurrenceDays.includes(day)),
    };
  }

  return { kind: 'preset', translationKey: PRESET_TRANSLATION_KEYS[preset] };
}

export function formatShiftOrgUnitLabel(organizationUnit: {
  name: string;
  organization: { name: string };
}): string {
  if (organizationUnit.name === organizationUnit.organization.name) {
    return organizationUnit.name;
  }
  return `${organizationUnit.organization.name} · ${organizationUnit.name}`;
}
