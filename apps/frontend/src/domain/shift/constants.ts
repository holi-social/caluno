import {
  ALL_RECURRENCE_DAYS,
  DAY_VALUE_TO_RRULE,
  RECURRENCE_DAYS,
  type RecurrenceDayValue,
  RRULE_DAY_CODES,
  type RRuleDayCode,
  WEEKEND_DAYS,
  WORKING_DAYS,
} from '@repo/data';

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

export const RECURRENCE_PRESETS = [
  { label: 'Does not repeat', value: 'none', days: [] as string[] },
  { label: 'Every day', value: 'daily', days: [...ALL_RECURRENCE_DAYS] },
  {
    label: 'Every working day',
    value: 'working-days',
    days: [...WORKING_DAYS],
  },
  {
    label: 'Every weekend day',
    value: 'weekend',
    days: [...WEEKEND_DAYS],
  },
  { label: 'Custom recurrence', value: 'custom', days: [] as string[] },
] as const;

export type RecurrencePresetValue =
  (typeof RECURRENCE_PRESETS)[number]['value'];
