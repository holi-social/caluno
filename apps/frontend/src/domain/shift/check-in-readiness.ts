/**
 * Maps the four readiness facts from `checkInReadiness` to one state, in
 * priority order: an open time entry for the selected instance wins over
 * everything (the check-in already happened), then membership blocks before
 * participation, and a pending request is distinguished from no request at
 * all.
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

export function resolveCheckInReadiness(
  facts: CheckInReadinessFacts,
): CheckInReadinessState {
  if (facts.hasOpenTimeEntry) {
    return 'alreadyCheckedIn';
  }
  if (!facts.isMember) {
    return facts.openMembershipRequestId ? 'pendingMembership' : 'notMember';
  }
  if (!facts.isParticipating) {
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
