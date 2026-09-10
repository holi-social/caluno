/**
 * Maps the four readiness facts from `checkInReadiness` to one state, in
 * priority order: an open time entry for the selected instance wins over
 * everything (the check-in already happened), then membership blocks before
 * participation, and a pending request is distinguished from no request at
 * all. Without a shift, only the membership rung of that ladder applies.
 */

export type CheckInReadinessState =
  | 'alreadyCheckedIn'
  | 'notMember'
  | 'pendingMembership'
  | 'notInShift'
  | 'ready';

export type CheckInReadinessFacts = {
  hasOpenTimeEntry: boolean;
  isMember: boolean;
  openMembershipRequestId: string | null;
  isParticipating: boolean;
};

/**
 * `requiresShift: false` is the check-in-without-shift mode: there is no
 * instance to be a participant of and none to already be checked into, so the
 * two shift-scoped states drop out and only the membership gate remains.
 */
export function resolveCheckInReadiness(
  facts: CheckInReadinessFacts,
  options?: { requiresShift?: boolean },
): CheckInReadinessState {
  const requiresShift = options?.requiresShift ?? true;

  if (requiresShift && facts.hasOpenTimeEntry) {
    return 'alreadyCheckedIn';
  }
  if (!facts.isMember) {
    return facts.openMembershipRequestId ? 'pendingMembership' : 'notMember';
  }
  if (requiresShift && !facts.isParticipating) {
    return 'notInShift';
  }
  return 'ready';
}

/**
 * The already-checked-in blocker links to the decide page, which lists the
 * volunteer's open entries with per-entry check-out links (the check-out
 * page itself requires an entryId this state doesn't have).
 */
export function alreadyCheckedInDecideHref(checkInId: string): string {
  return `/check-in/${checkInId}/decide`;
}

/**
 * The ID verification card is a read-only side output of the readiness
 * facts, not a readiness state: verification is optional and never blocks
 * check-in. It appears only once every real blocker is cleared (ready),
 * the org unit enabled the feature, and the membership is not yet verified.
 */
export function shouldShowIdVerification(facts: {
  state: CheckInReadinessState;
  idVerificationEnabled: boolean;
  idVerified: boolean;
  membershipId: string | null;
}): boolean {
  return (
    facts.state === 'ready' &&
    facts.idVerificationEnabled &&
    !facts.idVerified &&
    facts.membershipId !== null
  );
}
