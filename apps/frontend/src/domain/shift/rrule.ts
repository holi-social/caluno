import { RRule } from 'rrule';

const dayToRRule: Record<string, number> = {
  MONDAY: RRule.MO.weekday,
  TUESDAY: RRule.TU.weekday,
  WEDNESDAY: RRule.WE.weekday,
  THURSDAY: RRule.TH.weekday,
  FRIDAY: RRule.FR.weekday,
  SATURDAY: RRule.SA.weekday,
  SUNDAY: RRule.SU.weekday,
};

export function generateRrule(
  startsAt: Date,
  recurrenceDays?: string[],
  recurrenceEndsAt?: Date,
): string | null {
  if (!recurrenceDays || recurrenceDays.length === 0) {
    return null;
  }

  const weekdays = recurrenceDays
    .map((d) => dayToRRule[d])
    .filter((d): d is number => d !== undefined);

  const rule = new RRule({
    freq: RRule.WEEKLY,
    dtstart: startsAt,
    byweekday: weekdays,
    until: recurrenceEndsAt,
  });

  return rule.toString().replace(/^RRULE:/, '');
}
