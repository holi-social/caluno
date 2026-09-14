import { describe, expect, it } from 'bun:test';
import {
  alreadyCheckedInDecideHref,
  resolveCheckInReadiness,
  shouldShowIdVerification,
} from '../check-in-readiness';

describe('resolveCheckInReadiness', () => {
  it('returns notMember when not a member and no open request', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: false,
        isMember: false,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notMember');
  });

  it('returns pendingMembership when not a member but a request is open', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: false,
        isMember: false,
        openMembershipRequestId: 'req-1',
        isParticipating: false,
      }),
    ).toBe('pendingMembership');
  });

  it('returns notInShift for a member who is not participating', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: false,
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
        hasOpenTimeEntry: false,
        isMember: true,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notInShift');
  });

  it('returns ready for a member who is participating', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: false,
        isMember: true,
        openMembershipRequestId: null,
        isParticipating: true,
      }),
    ).toBe('ready');
  });

  it('prioritizes membership over participation when both are missing', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: false,
        isMember: false,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('notMember');
  });

  it('returns alreadyCheckedIn when the volunteer has an open entry, even if otherwise ready', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: true,
        isMember: true,
        openMembershipRequestId: null,
        isParticipating: true,
      }),
    ).toBe('alreadyCheckedIn');
  });

  it('prioritizes alreadyCheckedIn over membership blockers', () => {
    expect(
      resolveCheckInReadiness({
        hasOpenTimeEntry: true,
        isMember: false,
        openMembershipRequestId: null,
        isParticipating: false,
      }),
    ).toBe('alreadyCheckedIn');
  });
});

describe('resolveCheckInReadiness without a shift', () => {
  const noShift = { requiresShift: false };

  it('returns ready for a member, ignoring participation', () => {
    expect(
      resolveCheckInReadiness(
        {
          hasOpenTimeEntry: false,
          isMember: true,
          openMembershipRequestId: null,
          isParticipating: false,
        },
        noShift,
      ),
    ).toBe('ready');
  });

  it('ignores an open time entry: there is no instance to be checked into', () => {
    expect(
      resolveCheckInReadiness(
        {
          hasOpenTimeEntry: true,
          isMember: true,
          openMembershipRequestId: null,
          isParticipating: false,
        },
        noShift,
      ),
    ).toBe('ready');
  });

  it('still blocks a non-member', () => {
    expect(
      resolveCheckInReadiness(
        {
          hasOpenTimeEntry: false,
          isMember: false,
          openMembershipRequestId: null,
          isParticipating: false,
        },
        noShift,
      ),
    ).toBe('notMember');
  });

  it('still blocks on a pending membership request', () => {
    expect(
      resolveCheckInReadiness(
        {
          hasOpenTimeEntry: false,
          isMember: false,
          openMembershipRequestId: 'req-1',
          isParticipating: false,
        },
        noShift,
      ),
    ).toBe('pendingMembership');
  });
});

describe('alreadyCheckedInDecideHref', () => {
  it('points at the decide page, which lists open entries with check-out links', () => {
    expect(alreadyCheckedInDecideHref('abc-123')).toBe(
      '/check-in/abc-123/decide',
    );
  });
});

describe('shouldShowIdVerification', () => {
  const base = {
    state: 'ready' as const,
    idVerificationEnabled: true,
    idVerified: false,
    membershipId: 'm-1',
  };

  it('shows for an unverified member when the feature is enabled and readiness is ready', () => {
    expect(shouldShowIdVerification(base)).toBe(true);
  });

  it('stays hidden once the membership is verified (no re-trigger on later check-ins)', () => {
    expect(shouldShowIdVerification({ ...base, idVerified: true })).toBe(false);
  });

  it('stays hidden when the feature is disabled for the org unit', () => {
    expect(
      shouldShowIdVerification({ ...base, idVerificationEnabled: false }),
    ).toBe(false);
  });

  it('stays hidden while any readiness blocker is active', () => {
    for (const state of [
      'alreadyCheckedIn',
      'notMember',
      'pendingMembership',
      'notInShift',
    ] as const) {
      expect(shouldShowIdVerification({ ...base, state })).toBe(false);
    }
  });

  it('stays hidden without a membership id (nothing to verify)', () => {
    expect(shouldShowIdVerification({ ...base, membershipId: null })).toBe(
      false,
    );
  });
});
