export const AccountingEvent = {
  TIME_ENTRY_CLOSED: 'accounting.time-entry.closed',
} as const;

export type AccountingEvent =
  (typeof AccountingEvent)[keyof typeof AccountingEvent];
