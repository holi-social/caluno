import { registerEnumType } from '@nestjs/graphql';
import { JoinStatus } from '../../shared/enums/join-status.enum';

export enum ShiftVisibility {
  INVITED_MEMBERS = 'INVITED_MEMBERS',
  ALL_MEMBERS = 'ALL_MEMBERS',
}

export { SortOrder } from './sort-order.enum';

export enum ShiftInviteStatus {
  ADMIN_INVITED = 'ADMIN_INVITED',
  AWAITING_ADMIN_APPROVAL = 'AWAITING_ADMIN_APPROVAL',
  WAITLIST_JOINED = 'WAITLIST_JOINED',
  JOINED = 'JOINED',
  VOLUNTEER_REJECTED = 'VOLUNTEER_REJECTED',
  VOLUNTEER_CANCELLED = 'VOLUNTEER_CANCELLED',
  ADMIN_REJECTED = 'ADMIN_REJECTED',
}

/** Maps shift-instance invite status to volunteer JoinStatus (GLOSSARY § Join Status). */
export const INVITE_STATUS_TO_JOIN_SHIFT_STATUS: Record<
  ShiftInviteStatus,
  JoinStatus
> = {
  [ShiftInviteStatus.ADMIN_INVITED]: JoinStatus.INVITED,
  [ShiftInviteStatus.AWAITING_ADMIN_APPROVAL]: JoinStatus.PENDING,
  [ShiftInviteStatus.WAITLIST_JOINED]: JoinStatus.WAITLIST_JOINED,
  [ShiftInviteStatus.JOINED]: JoinStatus.JOINED,
  [ShiftInviteStatus.VOLUNTEER_REJECTED]: JoinStatus.VOLUNTEER_REJECTED,
  [ShiftInviteStatus.VOLUNTEER_CANCELLED]: JoinStatus.VOLUNTEER_REJECTED,
  [ShiftInviteStatus.ADMIN_REJECTED]: JoinStatus.REJECTED,
};

export enum ShiftCallOutDeliveryStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum ShiftCallOutSource {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

registerEnumType(ShiftCallOutSource, {
  name: 'ShiftCallOutSource',
});

export enum ShiftManagerNotificationKind {
  CALL_OUT_SUMMARY = 'CALL_OUT_SUMMARY',
  REMINDER = 'REMINDER',
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
