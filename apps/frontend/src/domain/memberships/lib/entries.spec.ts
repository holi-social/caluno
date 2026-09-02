import { describe, expect, it } from 'bun:test';
import { MembershipRequestStatus } from '@repo/data';
import { buildMembershipEntries } from './entries';

const orgUnit = (id: string, orgName = 'Care Org') => ({
  id,
  name: `Unit ${id}`,
  logoUrl: null,
  type: { icon: 'heart' },
  parent: null,
  organization: { name: orgName },
});

const membership = (id: string, orgUnitId: string, roles: string[] = []) => ({
  id,
  createdAt: '2024-01-14T00:00:00.000Z',
  roles: roles.map((name, i) => ({ id: `role-${i}`, name })),
  organizationUnit: orgUnit(orgUnitId),
});

const request = (
  id: string,
  orgUnitId: string,
  status: MembershipRequestStatus,
) => ({
  id,
  status,
  createdAt: '2026-03-05T00:00:00.000Z',
  reviewedAt: '2026-02-28T00:00:00.000Z',
  rejectionReason: null,
  organizationUnit: orgUnit(orgUnitId),
});

describe('buildMembershipEntries', () => {
  it('turns memberships into accepted entries with role names and join date', () => {
    const entries = buildMembershipEntries(
      [],
      [membership('m1', 'u1', ['Member'])],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      state: 'accepted',
      id: 'm1',
      organizationName: 'Care Org',
      orgUnit: expect.objectContaining({ id: 'u1', name: 'Unit u1' }),
      roles: ['Member'],
      date: new Date('2024-01-14T00:00:00.000Z'),
    });
  });

  it('merges accepted memberships with pending/rejected requests, accepted first', () => {
    const entries = buildMembershipEntries(
      [
        request('r1', 'u2', MembershipRequestStatus.Pending),
        request('r2', 'u3', MembershipRequestStatus.Rejected),
      ],
      [membership('m1', 'u1', ['Member'])],
    );
    expect(entries.map((e) => e.state)).toEqual([
      'accepted',
      'requested',
      'declined',
    ]);
  });

  it('ignores ACCEPTED requests entirely (memberships are master)', () => {
    const entries = buildMembershipEntries(
      [request('r1', 'u1', MembershipRequestStatus.Accepted)],
      [],
    );
    expect(entries).toEqual([]);
  });

  it('ignores CANCELLED requests', () => {
    const entries = buildMembershipEntries(
      [request('r1', 'u1', MembershipRequestStatus.Cancelled)],
      [],
    );
    expect(entries).toEqual([]);
  });

  it('suppresses a request for an org unit that already has a membership', () => {
    const entries = buildMembershipEntries(
      [request('r1', 'u1', MembershipRequestStatus.Pending)],
      [membership('m1', 'u1', ['Member'])],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.state).toBe('accepted');
  });

  it('omits roles as an empty array when the membership has no roles', () => {
    const entries = buildMembershipEntries([], [membership('m1', 'u1', [])]);
    const entry = entries[0];
    if (entry?.state === 'accepted') {
      expect(entry.roles).toEqual([]);
    }
  });

  it('orders newest-first within the same state', () => {
    const older = {
      ...membership('m1', 'u1', ['Member']),
      createdAt: '2023-01-01T00:00:00.000Z',
    };
    const newer = {
      ...membership('m2', 'u2', ['Member']),
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    const entries = buildMembershipEntries([], [older, newer]);
    expect(entries.map((e) => e.id)).toEqual(['m2', 'm1']);
  });

  it('returns only requested/declined when there are no memberships', () => {
    const entries = buildMembershipEntries(
      [request('r1', 'u1', MembershipRequestStatus.Pending)],
      [],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.state).toBe('requested');
  });

  it('returns an empty list for empty inputs', () => {
    expect(buildMembershipEntries([], [])).toEqual([]);
  });
});
