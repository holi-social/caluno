import {
  ALL_RECURRENCE_DAYS,
  DAY_VALUE_TO_RRULE,
  RECURRENCE_DAYS,
  type RecurrenceDayValue,
  RRULE_DAY_CODES,
  type RRuleDayCode,
  ShiftInviteStatus,
  WEEKEND_DAYS,
  WORKING_DAYS,
} from '@repo/data';

/** Invite statuses shown as "invited" in the admin invite sheet — pending or participating. */
export const INVITE_SHEET_INVITEE_STATUSES = [
  ShiftInviteStatus.Invited,
  ShiftInviteStatus.Accepted,
  ShiftInviteStatus.SelfJoined,
];

export {
  ALL_RECURRENCE_DAYS,
  DAY_VALUE_TO_RRULE,
  RECURRENCE_DAYS,
  type RecurrenceDayValue,
  RRULE_DAY_CODES,
  type RRuleDayCode,
  WEEKEND_DAYS,
  WORKING_DAYS,
};

export type RecurrencePresetValue =
  | 'none'
  | 'daily'
  | 'working-days'
  | 'weekend'
  | 'custom';

const RECURRENCE_PRESET_VALUES: {
  value: RecurrencePresetValue;
  days: string[];
}[] = [
  { value: 'none', days: [] },
  { value: 'daily', days: [...ALL_RECURRENCE_DAYS] },
  { value: 'working-days', days: [...WORKING_DAYS] },
  { value: 'weekend', days: [...WEEKEND_DAYS] },
  { value: 'custom', days: [] },
];

interface RecurrencePresetMessages {
  none: string;
  daily: string;
  workingDays: string;
  weekend: string;
  custom: string;
}

export function getRecurrencePresets(t: RecurrencePresetMessages) {
  const labelByValue: Record<RecurrencePresetValue, string> = {
    none: t.none,
    daily: t.daily,
    'working-days': t.workingDays,
    weekend: t.weekend,
    custom: t.custom,
  };

  return RECURRENCE_PRESET_VALUES.map((preset) => ({
    ...preset,
    label: labelByValue[preset.value],
  }));
}

export function getRecurrenceDays(t: (key: string) => string) {
  return RECURRENCE_DAYS.map((day) => ({
    ...day,
    label: t(`recurrence.weekDay.${day.value}`),
  }));
}
