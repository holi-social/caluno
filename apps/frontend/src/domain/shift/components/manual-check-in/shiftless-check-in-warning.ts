/**
 * Visibility rule for the shiftless check-in warning card. The volunteer is
 * always picked by the time ManualCheckInPage renders, so the only question
 * is whether the admin ticked "Check in without shift".
 */
export function shouldShowShiftlessCheckInWarning(withoutShift: boolean): boolean {
  return withoutShift;
}
