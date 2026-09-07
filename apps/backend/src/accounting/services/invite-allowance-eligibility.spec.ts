import {
  computeInviteAllowanceState,
  InviteAllowanceState,
  NEARLY_EXHAUSTED_REMAINING_RATIO,
} from './invite-allowance-eligibility';

const EHRENAMT_LIMIT_CENTS = 840_00;

describe('computeInviteAllowanceState', () => {
  it('returns NO_AGREEMENT when there is no active contract, regardless of allowance room', () => {
    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: false,
        remainingCents: EHRENAMT_LIMIT_CENTS,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents: 0,
      }),
    ).toBe(InviteAllowanceState.NO_AGREEMENT);
  });

  it('returns WOULD_EXCEED when this shift would push the volunteer past the ceiling', () => {
    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: true,
        remainingCents: 5_00,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents: 10_00,
      }),
    ).toBe(InviteAllowanceState.WOULD_EXCEED);
  });

  it('returns NEARLY_EXHAUSTED when room remains after the shift but under the threshold ratio', () => {
    const remainingCents = 100_00;
    const projectedCostCents = 95_00;
    // Remaining after shift = 5.00€, ratio of the 840€ ceiling = ~0.6% < 10%.
    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: true,
        remainingCents,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents,
      }),
    ).toBe(InviteAllowanceState.NEARLY_EXHAUSTED);
  });

  it('returns ELIGIBLE when comfortably above the nearly-exhausted threshold after the shift', () => {
    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: true,
        remainingCents: EHRENAMT_LIMIT_CENTS,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents: 10_00,
      }),
    ).toBe(InviteAllowanceState.ELIGIBLE);
  });

  it('sits exactly on the nearly-exhausted boundary (ratio * limit is NEARLY_EXHAUSTED, not ELIGIBLE)', () => {
    const boundaryRemaining =
      EHRENAMT_LIMIT_CENTS * NEARLY_EXHAUSTED_REMAINING_RATIO;
    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: true,
        remainingCents: boundaryRemaining,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents: 0,
      }),
    ).toBe(InviteAllowanceState.ELIGIBLE);

    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: true,
        remainingCents: boundaryRemaining - 1,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents: 0,
      }),
    ).toBe(InviteAllowanceState.NEARLY_EXHAUSTED);
  });

  it('treats exactly using up the remaining allowance (0 left) as NEARLY_EXHAUSTED, not WOULD_EXCEED', () => {
    expect(
      computeInviteAllowanceState({
        hasActiveAgreement: true,
        remainingCents: 10_00,
        limitCents: EHRENAMT_LIMIT_CENTS,
        projectedCostCents: 10_00,
      }),
    ).toBe(InviteAllowanceState.NEARLY_EXHAUSTED);
  });
});
