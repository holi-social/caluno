import {
  ALL_RECURRENCE_DAYS,
  getPresetFromDays,
  type RecurrenceDayValue,
  type RecurrencePresetValue,
} from './constants';

const SUCCESS_DIALOG_SHIFT_CREATED = 'success_dialog_shift_created';

type SuccessDialogCreatedShift = {
  shiftId: string;
  instanceId?: string;
};

export const getSuccessDialogCreatedShift =
  (): SuccessDialogCreatedShift | null => {
    const data = sessionStorage.getItem(SUCCESS_DIALOG_SHIFT_CREATED);

    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse success dialog shift created data', error);
      return null;
    }
  };

export const setSuccessDialogCreatedShift = (
  shift: SuccessDialogCreatedShift,
) => {
  sessionStorage.setItem(SUCCESS_DIALOG_SHIFT_CREATED, JSON.stringify(shift));
};

export const clearSuccessDialogCreatedShift = () => {
  sessionStorage.removeItem(SUCCESS_DIALOG_SHIFT_CREATED);
};

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
