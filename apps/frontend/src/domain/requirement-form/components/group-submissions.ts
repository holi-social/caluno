export interface SubmissionLike {
  id: string;
  status: string;
  submittedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
}

export interface VolunteerSubmissions {
  user: NonNullable<SubmissionLike['user']>;
  count: number;
  latestSubmissionId: string;
  latestSubmittedAt: string;
}

/**
 * One row per volunteer for a status tab: their submission count within
 * the status and their latest submission (row click opens it).
 */
export function groupSubmissionsByVolunteer(
  submissions: SubmissionLike[],
  status: string,
): VolunteerSubmissions[] {
  const byVolunteer = new Map<string, VolunteerSubmissions>();

  for (const submission of submissions) {
    if (submission.status !== status || !submission.user) continue;
    const { user } = submission;
    const existing = byVolunteer.get(user.id);
    if (
      !existing ||
      new Date(submission.submittedAt) > new Date(existing.latestSubmittedAt)
    ) {
      byVolunteer.set(user.id, {
        user,
        count: (existing?.count ?? 0) + 1,
        latestSubmissionId: submission.id,
        latestSubmittedAt: submission.submittedAt,
      });
    } else {
      existing.count += 1;
    }
  }

  return [...byVolunteer.values()];
}
