export const LAST_ORG_COOKIE = 'clippy.last_org_slug';
export const LOCALE_HEADER = 'x-locale';
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const RECURRENCE_DAYS = [
  { label: 'Mon', value: 'MONDAY' as const },
  { label: 'Tue', value: 'TUESDAY' as const },
  { label: 'Wed', value: 'WEDNESDAY' as const },
  { label: 'Thu', value: 'THURSDAY' as const },
  { label: 'Fri', value: 'FRIDAY' as const },
  { label: 'Sat', value: 'SATURDAY' as const },
  { label: 'Sun', value: 'SUNDAY' as const },
] as const;

export type RecurrenceDayValue = (typeof RECURRENCE_DAYS)[number]['value'];

export const ALL_RECURRENCE_DAYS: RecurrenceDayValue[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const WORKING_DAYS: RecurrenceDayValue[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

export const WEEKEND_DAYS: RecurrenceDayValue[] = ['SATURDAY', 'SUNDAY'];
export const RRULE_DAY_CODES = {
  MO: 'MONDAY',
  TU: 'TUESDAY',
  WE: 'WEDNESDAY',
  TH: 'THURSDAY',
  FR: 'FRIDAY',
  SA: 'SATURDAY',
  SU: 'SUNDAY',
} as const satisfies Record<string, RecurrenceDayValue>;

export type RRuleDayCode = keyof typeof RRULE_DAY_CODES;

export const DAY_VALUE_TO_RRULE: Record<RecurrenceDayValue, RRuleDayCode> = {
  MONDAY: 'MO',
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
  SUNDAY: 'SU',
};

export function parseRruleDays(
  rrule: string | null | undefined,
): RecurrenceDayValue[] {
  if (!rrule) return [];

  const bydayMatch = rrule.match(/BYDAY=([^;]+)/);
  if (!bydayMatch?.[1]) return [];

  const dayCodes = bydayMatch[1].split(',');

  return dayCodes
    .map((code) => RRULE_DAY_CODES[code as RRuleDayCode])
    .filter((day): day is RecurrenceDayValue => day !== undefined);
}

export function parseRruleEndDate(
  rrule: string | null | undefined,
): Date | undefined {
  if (!rrule) return undefined;

  const untilMatch = rrule.match(/UNTIL=([^;]+)/);
  if (!untilMatch?.[1]) return undefined;

  const untilStr = untilMatch[1];
  try {
    return new Date(untilStr);
  } catch {
    return undefined;
  }
}

const dayValueToLabel: Record<RecurrenceDayValue, string> = {} as Record<
  RecurrenceDayValue,
  string
>;
for (const day of RECURRENCE_DAYS) {
  dayValueToLabel[day.value] = day.label;
}

export function formatRrulePattern(rrule: string | null | undefined): string {
  if (!rrule) return 'One-time';

  const days = parseRruleDays(rrule);

  if (rrule.includes('WEEKLY')) {
    if (days.length === 0) return 'Weekly';
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && WORKING_DAYS.every((d) => days.includes(d))) {
      return 'Weekly (Workdays)';
    }
    if (days.length === 2 && WEEKEND_DAYS.every((d) => days.includes(d))) {
      return 'Weekly (Weekend)';
    }
    const dayLabels = days.map((d) => dayValueToLabel[d] || d).join(', ');
    return `Weekly (${dayLabels})`;
  }

  if (rrule.includes('DAILY')) return 'Daily';
  if (rrule.includes('MONTHLY')) return 'Monthly';
  return 'Recurring';
}
