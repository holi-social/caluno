export type StaffingState = 'full' | 'alert' | 'neutral';

export function getStaffingState(
  count: number,
  min: number | null | undefined,
  max: number | null | undefined,
): StaffingState {
  if (max != null && count >= max) {
    return 'full';
  }
  if (count === 0 || (min != null && count < min)) {
    return 'alert';
  }
  return 'neutral';
}

export function staffingBadgeText(
  count: number,
  min: number | null | undefined,
  max: number | null | undefined,
  state: StaffingState,
): string {
  if (state === 'alert' && min != null && count > 0) {
    return `${count}/${min}`;
  }
  if (max != null) {
    return `${count}/${max}`;
  }
  return `${count}`;
}
