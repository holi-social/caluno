import type { RecurrenceDay } from '../shift/enums';
import { parseRruleDays, parseRruleUntil } from '../shift/utils/parse-rrule';

export interface ShiftOccurrenceWindow {
  startsAt: Date;
  endsAt: Date;
}

export interface ShiftInviteSchedule {
  isRecurring: boolean;
  occurrenceCount: number;
  recurrenceDays: RecurrenceDay[];
  recurrenceEndDate?: Date;
  firstOccurrenceStartsAt: Date;
  firstOccurrenceEndsAt: Date;
  lastOccurrenceStartsAt?: Date;
}

interface BuildShiftInviteScheduleInput {
  rrule: string | null;
  originalStartsAt: Date;
  durationMinutes: number;
}

export function buildShiftInviteSchedule(
  shift: BuildShiftInviteScheduleInput,
  instances: ShiftOccurrenceWindow[],
): ShiftInviteSchedule {
  const sorted = [...instances].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  const firstOccurrenceStartsAt = sorted[0]?.startsAt ?? shift.originalStartsAt;
  const firstOccurrenceEndsAt =
    sorted[0]?.endsAt ??
    new Date(shift.originalStartsAt.getTime() + shift.durationMinutes * 60_000);
  const lastOccurrenceStartsAt =
    sorted.length > 1 ? sorted[sorted.length - 1]?.startsAt : undefined;
  const recurrenceEndDate =
    parseRruleUntil(shift.rrule) ?? lastOccurrenceStartsAt;

  return {
    isRecurring: Boolean(shift.rrule),
    occurrenceCount: sorted.length,
    recurrenceDays: parseRruleDays(shift.rrule),
    recurrenceEndDate,
    firstOccurrenceStartsAt,
    firstOccurrenceEndsAt,
    lastOccurrenceStartsAt,
  };
}
