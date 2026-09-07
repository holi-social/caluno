/**
 * Per-volunteer allowance status shown in the "invite volunteers" list for a
 * paid shift (VOLI-1248). Status signals only — never euro amounts, balances
 * or rates render anywhere downstream of this.
 */
export enum InviteAllowanceState {
  /** Agreement in place, allowance has room for this shift. */
  ELIGIBLE = 'ELIGIBLE',
  /** Room for this shift, but little beyond it. */
  NEARLY_EXHAUSTED = 'NEARLY_EXHAUSTED',
  /** Paying this person for THIS shift would exceed their annual ceiling. */
  WOULD_EXCEED = 'WOULD_EXCEED',
  /** No contract in place — cannot be paid at all yet. */
  NO_AGREEMENT = 'NO_AGREEMENT',
}

/**
 * "Nearly exhausted" threshold — judgment call (VOLI-1248 left this open).
 * Defined as a fraction of the reimbursement type's annual ceiling rather
 * than a multiple of a typical shift size: it needs no assumption about how
 * long shifts usually run, and is simple to explain to admins ("less than
 * 10% of the yearly limit left after this shift"). Named and exported so the
 * threshold is easy to find and retune without touching the logic below.
 */
export const NEARLY_EXHAUSTED_REMAINING_RATIO = 0.1;

export interface InviteAllowanceInput {
  /** Whether the volunteer has an active contract for this allowance type. */
  hasActiveAgreement: boolean;
  /**
   * Remaining annual allowance BEFORE this shift, in cents. Comes from the
   * same year-to-date payout-sum computation the accounting surfaces use
   * (`ReimbursementRateService.getRosterYearlyUsage` /
   * `getYearlyUsage`) — see VOLI-1244, which fixes that sum to be scoped to
   * the year rather than the month it is scoped to today. This function
   * does not care how `remainingCents` was derived, so it inherits that fix
   * automatically once VOLI-1244 lands and this branch is rebased.
   */
  remainingCents: number;
  /** The reimbursement type's annual ceiling, in cents (e.g. 840 €, 3 000 €). */
  limitCents: number;
  /** Projected cost of paying this person for THIS shift, in cents. */
  projectedCostCents: number;
}

/**
 * Pure decision function — no I/O — so it can be unit tested directly and
 * reused by both the resolver-facing service and any future caller without
 * re-deriving the rule.
 */
export function computeInviteAllowanceState(
  input: InviteAllowanceInput,
): InviteAllowanceState {
  const { hasActiveAgreement, remainingCents, limitCents, projectedCostCents } =
    input;

  if (!hasActiveAgreement) {
    return InviteAllowanceState.NO_AGREEMENT;
  }

  const remainingAfterShiftCents = remainingCents - projectedCostCents;

  if (remainingAfterShiftCents < 0) {
    return InviteAllowanceState.WOULD_EXCEED;
  }

  if (
    remainingAfterShiftCents <
    limitCents * NEARLY_EXHAUSTED_REMAINING_RATIO
  ) {
    return InviteAllowanceState.NEARLY_EXHAUSTED;
  }

  return InviteAllowanceState.ELIGIBLE;
}
