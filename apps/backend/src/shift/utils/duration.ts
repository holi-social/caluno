export const MIN_SHIFT_DURATION_MINUTES = 1;
export const MAX_SHIFT_DURATION_MINUTES = 24 * 60 - 1;

export function getDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function isValidShiftDurationMinutes(minutes: number): boolean {
  return (
    minutes >= MIN_SHIFT_DURATION_MINUTES &&
    minutes <= MAX_SHIFT_DURATION_MINUTES
  );
}
