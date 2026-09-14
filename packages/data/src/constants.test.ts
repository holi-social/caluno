import { describe, expect, it } from 'bun:test';
import {
  ALL_RECURRENCE_DAYS,
  formatRrulePattern,
  isRecurringRrule,
  isSingleOccurrenceRrule,
  parseRruleDays,
  type RecurrenceDayValue,
  WEEKEND_DAYS,
  WORKING_DAYS,
} from './constants';

const ALL_DAYS: RecurrenceDayValue[] = [...ALL_RECURRENCE_DAYS];

describe('rrule helpers — recurring / apply-to-all-future scenarios', () => {
  describe('A. Does not repeat — rrule: null', () => {
    const rrule = null;

    it('labels as One-time', () => {
      expect(formatRrulePattern(rrule)).toBe('One-time');
    });

    it('parses no days', () => {
      expect(parseRruleDays(rrule)).toEqual([]);
    });

    it('is not recurring (no apply/invite-to-all)', () => {
      expect(isSingleOccurrenceRrule(rrule)).toBe(true);
      expect(isRecurringRrule(rrule)).toBe(false);
    });
  });

  describe('B. Fixture one-time — FREQ=DAILY;COUNT=1 (Beach Cleanup / Cleanup Crew)', () => {
    const rrule = 'FREQ=DAILY;COUNT=1';

    it('labels as One-time (not Daily)', () => {
      expect(formatRrulePattern(rrule)).toBe('One-time');
    });

    it('parses no days', () => {
      expect(parseRruleDays(rrule)).toEqual([]);
    });

    it('is not recurring (no apply/invite-to-all)', () => {
      expect(isSingleOccurrenceRrule(rrule)).toBe(true);
      expect(isRecurringRrule(rrule)).toBe(false);
    });
  });

  describe('C. Every day (UI) — WEEKLY with all 7 BYDAY days', () => {
    // generateRrule always emits WEEKLY+BYDAY (never FREQ=DAILY); may include DTSTART.
    const cases = [
      'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU',
      'DTSTART:20260302T100000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU',
    ];

    for (const rrule of cases) {
      it(`labels as Daily for ${JSON.stringify(rrule)}`, () => {
        expect(formatRrulePattern(rrule)).toBe('Daily');
      });

      it(`parses all 7 days for ${JSON.stringify(rrule)}`, () => {
        expect(parseRruleDays(rrule)).toEqual(ALL_DAYS);
      });

      it(`is recurring (apply/invite-to-all shown) for ${JSON.stringify(rrule)}`, () => {
        expect(isSingleOccurrenceRrule(rrule)).toBe(false);
        expect(isRecurringRrule(rrule)).toBe(true);
      });
    }
  });

  describe('D. Every working day — WEEKLY MO-FR', () => {
    const rrule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';

    it('labels as Weekly (Workdays)', () => {
      expect(formatRrulePattern(rrule)).toBe('Weekly (Workdays)');
    });

    it('parses working days', () => {
      expect(parseRruleDays(rrule)).toEqual([...WORKING_DAYS]);
    });

    it('is recurring (apply/invite-to-all shown)', () => {
      expect(isSingleOccurrenceRrule(rrule)).toBe(false);
      expect(isRecurringRrule(rrule)).toBe(true);
    });
  });

  describe('E. Every weekend day — WEEKLY SA,SU', () => {
    const rrule = 'FREQ=WEEKLY;BYDAY=SA,SU';

    it('labels as Weekly (Weekend)', () => {
      expect(formatRrulePattern(rrule)).toBe('Weekly (Weekend)');
    });

    it('parses weekend days', () => {
      expect(parseRruleDays(rrule)).toEqual([...WEEKEND_DAYS]);
    });

    it('is recurring (apply/invite-to-all shown)', () => {
      expect(isSingleOccurrenceRrule(rrule)).toBe(false);
      expect(isRecurringRrule(rrule)).toBe(true);
    });
  });

  describe('F. Custom — WEEKLY WE,TH', () => {
    const rrule = 'FREQ=WEEKLY;BYDAY=WE,TH';

    it('labels with day names', () => {
      expect(formatRrulePattern(rrule)).toBe('Weekly (Wed, Thu)');
    });

    it('parses custom days', () => {
      expect(parseRruleDays(rrule)).toEqual(['WEDNESDAY', 'THURSDAY']);
    });

    it('is recurring (apply/invite-to-all shown)', () => {
      expect(isSingleOccurrenceRrule(rrule)).toBe(false);
      expect(isRecurringRrule(rrule)).toBe(true);
    });
  });

  describe('G. Legacy true daily series — FREQ=DAILY without COUNT=1', () => {
    const cases = ['FREQ=DAILY;INTERVAL=1', 'FREQ=DAILY;COUNT=5'];

    for (const rrule of cases) {
      it(`labels as Daily for ${rrule}`, () => {
        expect(formatRrulePattern(rrule)).toBe('Daily');
      });

      it(`parses all 7 days for ${rrule}`, () => {
        expect(parseRruleDays(rrule)).toEqual(ALL_DAYS);
      });

      it(`is recurring (apply/invite-to-all shown) for ${rrule}`, () => {
        expect(isSingleOccurrenceRrule(rrule)).toBe(false);
        expect(isRecurringRrule(rrule)).toBe(true);
      });
    }
  });

  describe('H. Edge — FREQ=WEEKLY;COUNT=3 without BYDAY (Weekly Meal Prep)', () => {
    const rrule = 'FREQ=WEEKLY;COUNT=3';

    it('labels as Weekly', () => {
      expect(formatRrulePattern(rrule)).toBe('Weekly');
    });

    it('parses no BYDAY days', () => {
      expect(parseRruleDays(rrule)).toEqual([]);
    });

    it('is recurring (apply/invite-to-all shown)', () => {
      expect(isSingleOccurrenceRrule(rrule)).toBe(false);
      expect(isRecurringRrule(rrule)).toBe(true);
    });
  });
});

describe('isSingleOccurrenceRrule', () => {
  it('treats null/undefined/empty as single-occurrence', () => {
    expect(isSingleOccurrenceRrule(null)).toBe(true);
    expect(isSingleOccurrenceRrule(undefined)).toBe(true);
    expect(isSingleOccurrenceRrule('')).toBe(true);
  });

  it('matches COUNT=1 in any segment position', () => {
    expect(isSingleOccurrenceRrule('COUNT=1;FREQ=DAILY')).toBe(true);
    expect(isSingleOccurrenceRrule('FREQ=DAILY;COUNT=1;WKST=MO')).toBe(true);
  });

  it('does not treat COUNT=10 or COUNT=11 as single-occurrence', () => {
    expect(isSingleOccurrenceRrule('FREQ=DAILY;COUNT=10')).toBe(false);
    expect(isSingleOccurrenceRrule('FREQ=DAILY;COUNT=11')).toBe(false);
  });
});

describe('isRecurringRrule', () => {
  it('is false for one-time shifts (no rrule, empty, or COUNT=1)', () => {
    expect(isRecurringRrule(null)).toBe(false);
    expect(isRecurringRrule(undefined)).toBe(false);
    expect(isRecurringRrule('')).toBe(false);
    expect(isRecurringRrule('FREQ=DAILY;COUNT=1')).toBe(false);
    expect(
      isRecurringRrule('DTSTART:20260302T100000Z\nRRULE:FREQ=DAILY;COUNT=1'),
    ).toBe(false);
  });

  it('is true for recurring rrules', () => {
    expect(isRecurringRrule('FREQ=WEEKLY;BYDAY=MO,TU')).toBe(true);
    expect(isRecurringRrule('FREQ=WEEKLY;COUNT=3')).toBe(true);
    expect(isRecurringRrule('FREQ=DAILY;COUNT=5')).toBe(true);
  });

  it('matches the card-icon gating: recurring iff the pattern label is not One-time', () => {
    const cases = [
      null,
      '',
      'FREQ=DAILY;COUNT=1',
      'FREQ=WEEKLY;BYDAY=MO,TU',
      'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU',
      'FREQ=WEEKLY;COUNT=3',
    ];

    for (const rrule of cases) {
      expect(isRecurringRrule(rrule)).toBe(
        formatRrulePattern(rrule) !== 'One-time',
      );
    }
  });
});
