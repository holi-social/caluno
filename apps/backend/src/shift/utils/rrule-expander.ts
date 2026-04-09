import * as rruleLib from 'rrule';
import { DAY_VALUE_TO_RRULE, type RecurrenceDay } from '../enums';

const { RRule, rrulestr } = rruleLib;

const MAX_INSTANCES = 730;
const EXPANSION_MONTHS = 12;

export interface ShiftInstanceData {
  actualStartsAt: Date;
  actualEndsAt: Date;
  occurrenceIndex: number;
}

function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function preserveLocalTime(baseDate: Date, occurrenceUtc: Date): Date {
  const baseOffset = baseDate.getTimezoneOffset();
  const occurrenceOffset = occurrenceUtc.getTimezoneOffset();
  const offsetDiff = (occurrenceOffset - baseOffset) * 60000;

  return new Date(occurrenceUtc.getTime() + offsetDiff);
}

export function expandShift(
  rruleString: string | null,
  dtstart: Date,
  durationMinutes: number,
): ShiftInstanceData[] {
  if (!rruleString) {
    return [
      {
        actualStartsAt: dtstart,
        actualEndsAt: new Date(dtstart.getTime() + durationMinutes * 60000),
        occurrenceIndex: 0,
      },
    ];
  }

  const timezone = getLocalTimezone();
  const rrule = rrulestr(rruleString, {
    dtstart,
    tzid: timezone,
  });

  const until = rrule.options.until;
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + EXPANSION_MONTHS);

  const expansionEnd = until && until < maxDate ? until : maxDate;
  const occurrences = rrule.between(dtstart, expansionEnd, true);

  if (occurrences.length > MAX_INSTANCES) {
    throw new Error(
      `rrule generate ${occurrences.length} instances. max allowed ${MAX_INSTANCES}.`,
    );
  }

  return occurrences.map((date, index) => {
    const adjustedStart = preserveLocalTime(dtstart, date);
    return {
      actualStartsAt: adjustedStart,
      actualEndsAt: new Date(adjustedStart.getTime() + durationMinutes * 60000),
      occurrenceIndex: index,
    };
  });
}

export function generateRrule(
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  byday: RecurrenceDay[],
  until?: Date,
  count?: number,
): string {
  const tzid = getLocalTimezone();
  const freqMap = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
  };

  const options: Partial<rruleLib.Options> = {
    freq: freqMap[freq],
    dtstart: new Date(),
    tzid,
    interval: 1,
    wkst: RRule.MO,
  };

  if (byday?.length) {
    const weekdayMap: Record<string, number> = {
      MO: RRule.MO.weekday,
      TU: RRule.TU.weekday,
      WE: RRule.WE.weekday,
      TH: RRule.TH.weekday,
      FR: RRule.FR.weekday,
      SA: RRule.SA.weekday,
      SU: RRule.SU.weekday,
    };
    const rruleCodes = byday.map((day) => DAY_VALUE_TO_RRULE[day]);
    options.byweekday = rruleCodes.map((code) => weekdayMap[code]);
  }

  if (until) {
    options.until = until;
  }

  if (count) {
    options.count = count;
  }

  const rrule = new RRule(options);
  return rrule.toString().replace(/^RRULE:/, '');
}
