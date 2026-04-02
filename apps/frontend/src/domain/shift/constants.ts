export const RECURRENCE_DAYS = [
  { label: 'Mon', value: 'MONDAY' },
  { label: 'Tue', value: 'TUESDAY' },
  { label: 'Wed', value: 'WEDNESDAY' },
  { label: 'Thu', value: 'THURSDAY' },
  { label: 'Fri', value: 'FRIDAY' },
  { label: 'Sat', value: 'SATURDAY' },
  { label: 'Sun', value: 'SUNDAY' },
] as const;

const ALL_DAYS = RECURRENCE_DAYS.map((d) => d.value);
const WORKING_DAYS = ALL_DAYS.filter((d) => d !== 'SATURDAY' && d !== 'SUNDAY');
const WEEKEND_DAYS = ['SATURDAY', 'SUNDAY'] as const;

export type RecurrenceDayValue = (typeof RECURRENCE_DAYS)[number]['value'];

export const RECURRENCE_PRESETS = [
  { label: 'Does not repeat', value: 'none', days: [] as string[] },
  { label: 'Every day', value: 'daily', days: [...ALL_DAYS] },
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
