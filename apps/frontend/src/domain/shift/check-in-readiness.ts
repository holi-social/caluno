/**
 * Maps the three readiness facts from `checkInReadiness` to one state, in
 * priority order, per the spec's readiness gate table: membership blocks
 * before participation, and a pending request is distinguished from no
 * request at all.
 */

export type CheckInReadinessState =
  | 'notMember'
  | 'pendingMembership'
  | 'notInShift'
  | 'ready';

export type CheckInReadinessFacts = {
  isMember: boolean;
  openMembershipRequestId: string | null;
  isParticipating: boolean;
};

export function resolveCheckInReadiness(
  facts: CheckInReadinessFacts,
): CheckInReadinessState {
  if (!facts.isMember) {
    return facts.openMembershipRequestId ? 'pendingMembership' : 'notMember';
  }
  if (!facts.isParticipating) {
    return 'notInShift';
  }
  return 'ready';
}
