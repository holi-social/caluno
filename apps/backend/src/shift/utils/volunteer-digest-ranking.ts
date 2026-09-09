// Pure ranking logic for the Sunday volunteer digest's "shifts that need
// people" section — see VolunteerDigestService for how candidates are
// gathered and this is invoked. Rules per the PO's spec (VOLI-1169-style
// digest):
//   gap = minimum set        -> minimum - accepted
//         no minimum, accepted == 0            -> 1
//         no minimum, accepted > 0, below max   -> 0.5
//         no minimum, accepted >= max (no room) -> 0
//   eligible = gap > 0 AND days_left in [2, 35] AND NOT (gap > 4 AND days_left < 4)
//   order by gap / days_left descending, ties broken by soonest start then id
//   capped at 10 rows (per organisation — the caller groups by organisation
//   and calls this once per group).
export interface NeedsVolunteersCandidate {
  instanceId: string;
  /** Effective minimum (instance override ?? series minimum), null if unset. */
  minVolunteers: number | null;
  /** Effective maximum (instance override ?? series maximum), null if uncapped. */
  maxVolunteers: number | null;
  filledCount: number;
  /** Fractional days from send time to shift start (hours_until_start / 24). */
  daysLeft: number;
  actualStartsAt: Date;
}

export type ShiftNeedReason =
  | { kind: 'MINIMUM_SHORTFALL'; needed: number }
  | { kind: 'NO_VOLUNTEERS_YET' }
  | { kind: 'HAS_ROOM' };

export interface RankedNeedsVolunteersShift {
  instanceId: string;
  gap: number;
  daysLeft: number;
  reason: ShiftNeedReason;
}

const MIN_DAYS_LEFT = 2;
const MAX_DAYS_LEFT = 35;
const UNRESCUABLE_GAP_THRESHOLD = 4;
const UNRESCUABLE_DAYS_LEFT_THRESHOLD = 4;
export const MAX_NEEDS_VOLUNTEERS_ROWS_PER_ORGANIZATION = 10;

export function computeGap(input: {
  minVolunteers: number | null;
  maxVolunteers: number | null;
  filledCount: number;
}): number {
  if (input.minVolunteers != null) {
    return Math.max(input.minVolunteers - input.filledCount, 0);
  }
  if (input.filledCount === 0) return 1;

  const hasRoom =
    input.maxVolunteers == null || input.filledCount < input.maxVolunteers;
  return hasRoom ? 0.5 : 0;
}

function reasonForGap(
  input: Pick<NeedsVolunteersCandidate, 'minVolunteers' | 'filledCount'>,
): ShiftNeedReason {
  if (input.minVolunteers != null) {
    return {
      kind: 'MINIMUM_SHORTFALL',
      needed: input.minVolunteers - input.filledCount,
    };
  }
  // Only reached when eligible (gap > 0), so this is always the 1 or 0.5
  // fallback-gap branch of computeGap — never the "no room" (gap === 0) one.
  return input.filledCount === 0
    ? { kind: 'NO_VOLUNTEERS_YET' }
    : { kind: 'HAS_ROOM' };
}

function isEligible(gap: number, daysLeft: number): boolean {
  if (gap <= 0) return false;
  if (daysLeft < MIN_DAYS_LEFT || daysLeft > MAX_DAYS_LEFT) return false;
  if (
    gap > UNRESCUABLE_GAP_THRESHOLD &&
    daysLeft < UNRESCUABLE_DAYS_LEFT_THRESHOLD
  ) {
    return false;
  }
  return true;
}

/**
 * Ranks and caps one organisation's needs-volunteers candidates. Callers
 * must pre-filter candidates to a single organisation — gap is only
 * comparable within one organisation's own minimum-setting convention (see
 * the PO's rationale for the fallback gap values above).
 */
export function rankShiftsNeedingVolunteers(
  candidates: NeedsVolunteersCandidate[],
): RankedNeedsVolunteersShift[] {
  return candidates
    .map((candidate) => ({
      candidate,
      gap: computeGap(candidate),
    }))
    .filter(({ candidate, gap }) => isEligible(gap, candidate.daysLeft))
    .sort((a, b) => {
      const ratioA = a.gap / a.candidate.daysLeft;
      const ratioB = b.gap / b.candidate.daysLeft;
      if (ratioB !== ratioA) return ratioB - ratioA;

      const startDiff =
        a.candidate.actualStartsAt.getTime() -
        b.candidate.actualStartsAt.getTime();
      if (startDiff !== 0) return startDiff;

      return a.candidate.instanceId.localeCompare(b.candidate.instanceId);
    })
    .slice(0, MAX_NEEDS_VOLUNTEERS_ROWS_PER_ORGANIZATION)
    .map(({ candidate, gap }) => ({
      instanceId: candidate.instanceId,
      gap,
      daysLeft: candidate.daysLeft,
      reason: reasonForGap(candidate),
    }));
}
