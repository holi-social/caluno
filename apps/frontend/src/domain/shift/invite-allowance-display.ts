/**
 * Per-volunteer allowance status for the "invite volunteers" list on a paid
 * shift (VOLI-1248). Mirrors the backend `InviteAllowanceState` GraphQL
 * enum. Status signals only — the invite list never renders a euro amount,
 * balance, or rate for any role.
 */
export type InviteAllowanceState =
  | 'ELIGIBLE'
  | 'NEARLY_EXHAUSTED'
  | 'WOULD_EXCEED'
  | 'NO_AGREEMENT';

/**
 * Only "would exceed" needs an explicit confirmation before inviting —
 * "nearly exhausted" is informational and does not block or gate the invite.
 */
export function requiresInviteConfirmation(
  state: InviteAllowanceState | null | undefined,
): boolean {
  return state === 'WOULD_EXCEED';
}

export type InviteAllowanceDisplayTone = 'positive' | 'caution' | 'warning';

export type InviteAllowanceDisplay = {
  /** i18n key under `Shift.transferList.allowance`. */
  labelKey: 'eligible' | 'nearlyExhausted' | 'wouldExceed' | 'noAgreement';
  /** Never color-only: paired with a distinct label (and icon in the UI). */
  tone: InviteAllowanceDisplayTone;
};

const ALLOWANCE_DISPLAY: Record<InviteAllowanceState, InviteAllowanceDisplay> =
  {
    ELIGIBLE: { labelKey: 'eligible', tone: 'positive' },
    NEARLY_EXHAUSTED: { labelKey: 'nearlyExhausted', tone: 'caution' },
    WOULD_EXCEED: { labelKey: 'wouldExceed', tone: 'warning' },
    NO_AGREEMENT: { labelKey: 'noAgreement', tone: 'caution' },
  };

export function toInviteAllowanceDisplay(
  state: InviteAllowanceState,
): InviteAllowanceDisplay {
  return ALLOWANCE_DISPLAY[state];
}
