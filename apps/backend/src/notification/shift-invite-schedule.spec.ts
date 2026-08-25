import { RecurrenceDay } from '../shift/enums';
import { buildShiftInviteSchedule } from './shift-invite-schedule';

describe('buildShiftInviteSchedule', () => {
  it('summarizes recurring shift instances', () => {
    const shift = {
      rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      originalStartsAt: new Date('2026-07-06T10:00:00.000Z'),
      durationMinutes: 180,
    };
    const instances = Array.from({ length: 7 }, (_, index) => {
      const startsAt = new Date('2026-07-06T10:00:00.000Z');
      startsAt.setDate(startsAt.getDate() + index * 2);

      return {
        startsAt,
        endsAt: new Date(startsAt.getTime() + 180 * 60_000),
      };
    });

    const schedule = buildShiftInviteSchedule(shift, instances);

    expect(schedule.isRecurring).toBe(true);
    expect(schedule.occurrenceCount).toBe(7);
    expect(schedule.recurrenceDays).toEqual([
      RecurrenceDay.MONDAY,
      RecurrenceDay.WEDNESDAY,
    ]);
  });
});
