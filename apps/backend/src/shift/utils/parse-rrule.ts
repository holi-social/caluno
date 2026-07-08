import {
  type RecurrenceDay,
  RRULE_DAY_CODES,
  type RRuleDayCode,
} from '../enums';

export function parseRruleDays(
  rrule: string | null | undefined,
): RecurrenceDay[] {
  if (!rrule) {
    return [];
  }

  const bydayMatch = rrule.match(/BYDAY=([^;]+)/);
  if (!bydayMatch?.[1]) {
    return [];
  }

  return bydayMatch[1]
    .split(',')
    .map((code) => RRULE_DAY_CODES[code.trim() as RRuleDayCode])
    .filter((day): day is RecurrenceDay => day !== undefined);
}

export function parseRruleUntil(
  rrule: string | null | undefined,
): Date | undefined {
  if (!rrule) {
    return undefined;
  }

  const untilMatch = rrule.match(/UNTIL=([^;]+)/);
  if (!untilMatch?.[1]) {
    return undefined;
  }

  const until = new Date(untilMatch[1]);
  return Number.isNaN(until.getTime()) ? undefined : until;
}
