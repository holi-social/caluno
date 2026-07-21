export enum ShiftVisibility {
  INVITED_MEMBERS = 'INVITED_MEMBERS',
  ALL_MEMBERS = 'ALL_MEMBERS',
}

export enum ShiftInviteStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  SELF_JOINED = 'SELF_JOINED',
}

export enum RecurrenceDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export const RECURRENCE_DAYS = [
  { label: 'Mon', value: RecurrenceDay.MONDAY },
  { label: 'Tue', value: RecurrenceDay.TUESDAY },
  { label: 'Wed', value: RecurrenceDay.WEDNESDAY },
  { label: 'Thu', value: RecurrenceDay.THURSDAY },
  { label: 'Fri', value: RecurrenceDay.FRIDAY },
  { label: 'Sat', value: RecurrenceDay.SATURDAY },
  { label: 'Sun', value: RecurrenceDay.SUNDAY },
] as const;

export const ALL_RECURRENCE_DAYS: RecurrenceDay[] = [
  RecurrenceDay.MONDAY,
  RecurrenceDay.TUESDAY,
  RecurrenceDay.WEDNESDAY,
  RecurrenceDay.THURSDAY,
  RecurrenceDay.FRIDAY,
  RecurrenceDay.SATURDAY,
  RecurrenceDay.SUNDAY,
];

export const WORKING_DAYS: RecurrenceDay[] = [
  RecurrenceDay.MONDAY,
  RecurrenceDay.TUESDAY,
  RecurrenceDay.WEDNESDAY,
  RecurrenceDay.THURSDAY,
  RecurrenceDay.FRIDAY,
];

export const WEEKEND_DAYS: RecurrenceDay[] = [
  RecurrenceDay.SATURDAY,
  RecurrenceDay.SUNDAY,
];

export const RRULE_DAY_CODES = {
  MO: RecurrenceDay.MONDAY,
  TU: RecurrenceDay.TUESDAY,
  WE: RecurrenceDay.WEDNESDAY,
  TH: RecurrenceDay.THURSDAY,
  FR: RecurrenceDay.FRIDAY,
  SA: RecurrenceDay.SATURDAY,
  SU: RecurrenceDay.SUNDAY,
} as const satisfies Record<string, RecurrenceDay>;

export type RRuleDayCode = keyof typeof RRULE_DAY_CODES;
export const DAY_VALUE_TO_RRULE: Record<RecurrenceDay, RRuleDayCode> = {
  [RecurrenceDay.MONDAY]: 'MO',
  [RecurrenceDay.TUESDAY]: 'TU',
  [RecurrenceDay.WEDNESDAY]: 'WE',
  [RecurrenceDay.THURSDAY]: 'TH',
  [RecurrenceDay.FRIDAY]: 'FR',
  [RecurrenceDay.SATURDAY]: 'SA',
  [RecurrenceDay.SUNDAY]: 'SU',
};
