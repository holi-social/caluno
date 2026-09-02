import { describe, expect, it } from 'bun:test';
import { resolveCheckInReadiness } from '../check-in-readiness';

describe('resolveCheckInReadiness', () => {
  it('returns notMember when not a member and no open request', () => {
    expect(
      resolveCheckInReadiness({
        isMember: false,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notMember');
  });

  it('returns pendingMembership when not a member but a request is open', () => {
    expect(
      resolveCheckInReadiness({
        isMember: false,
        openMembershipRequestId: 'req-1',
        isParticipating: false,
      }),
    ).toBe('pendingMembership');
  });

  it('returns notInShift for a member who is not participating', () => {
    expect(
      resolveCheckInReadiness({
        isMember: true,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notInShift');
  });

  it('returns notInShift for a member with only an INVITED (not accepted) invite', () => {
    // isParticipating is already false here — the backend's
    // isParticipatingShiftInviteStatus excludes INVITED before this facts
    // object is ever built. This fixture documents that boundary at this
    // layer too, per the spec's testing section.
    expect(
      resolveCheckInReadiness({
        isMember: true,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notInShift');
  });

  it('returns ready for a member who is participating', () => {
    expect(
      resolveCheckInReadiness({
        isMember: true,
        openMembershipRequestId: null,
        isParticipating: true,
      }),
    ).toBe('ready');
  });

  it('prioritizes membership over participation when both are missing', () => {
    expect(
      resolveCheckInReadiness({
        isMember: false,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notMember');
  });
});
