import { describe, expect, it } from 'bun:test';
import { groupSubmissionsByVolunteer } from './group-submissions';

const submission = (id: string, userId: string, submittedAt: string) => ({
  id,
  submittedAt,
  user: { id: userId, name: `User ${userId}`, email: `${userId}@example.org` },
});

describe('groupSubmissionsByVolunteer', () => {
  it('returns one row per volunteer with their submission count', () => {
    const rows = groupSubmissionsByVolunteer([
      submission('s1', 'u1', '2026-07-01T10:00:00Z'),
      submission('s2', 'u1', '2026-07-02T10:00:00Z'),
      submission('s3', 'u2', '2026-07-01T12:00:00Z'),
    ]);

    expect(rows).toHaveLength(2);
    const u1 = rows.find((r) => r.user.id === 'u1');
    expect(u1?.count).toBe(2);
  });

  it("points at the volunteer's latest submission", () => {
    const rows = groupSubmissionsByVolunteer([
      submission('s1', 'u1', '2026-07-02T10:00:00Z'),
      submission('s2', 'u1', '2026-07-01T10:00:00Z'),
    ]);

    expect(rows[0]?.latestSubmissionId).toBe('s1');
    expect(rows[0]?.latestSubmittedAt).toBe('2026-07-02T10:00:00Z');
  });

  it('skips submissions without a user', () => {
    const rows = groupSubmissionsByVolunteer([
      {
        id: 's1',
        submittedAt: '2026-07-01T10:00:00Z',
        user: null,
      },
    ]);

    expect(rows).toEqual([]);
  });
});
