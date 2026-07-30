import type { PauschalenType } from './components/doc-type-header';

// Single source for org-level Pauschale rates until the rates query/mutation
// (SF-1 to-do #5) lands. Any UI that shows "the accounting rate" for a
// Pauschale type reads from here, so it stays in lockstep with the Rates
// settings tab instead of drifting into its own placeholder numbers.
export const MOCK_HQ_DEFAULTS: Record<PauschalenType, number> = {
  ehrenamt: 5.0,
  uebungleiter: 8.0,
};

export const MOCK_SAVED_OVERRIDES: Record<PauschalenType, number | undefined> =
  {
    ehrenamt: 4.5,
    uebungleiter: undefined,
  };

export function getEffectivePauschaleRate(type: PauschalenType): number {
  return MOCK_SAVED_OVERRIDES[type] ?? MOCK_HQ_DEFAULTS[type];
}

// Annual tax-free limits per Pauschale type (EStG §3 no. 26/26a), until VOLI-676's
// accounting backend provides these. UserCard reads this to flag when a member's
// projected total would exceed the legal limit.
export const MOCK_PAUSCHALE_LIMITS: Record<PauschalenType, number> = {
  ehrenamt: 960,
  uebungleiter: 3300,
};

// Mock only: whether a member is eligible for a Pauschale at all isn't tracked yet
// (no backend field). Deterministic per member id, same rationale as
// getMockShiftType — ~80% of members come back eligible so the prototype shows a
// realistic mix instead of every member having a limit.
export function getMockPauschaleEligibility(memberId: string): boolean {
  const seeded = `eligibility:${memberId}`;
  let hash = 0;
  for (let i = 0; i < seeded.length; i++) {
    hash = (hash * 31 + seeded.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 5 !== 0;
}

// Mock only: how much of a member's annual Pauschale limit is already used isn't
// tracked yet (no backend field). Deterministic per member id, same rationale as
// shift-type.tsx's getMockShiftType — the prototype shows realistic variety per
// member instead of one hardcoded amount everywhere. `shiftHours` scales the
// projected addition to the actual shift instance being invited to.
export function getMockPauschaleUsage(
  memberId: string,
  type: PauschalenType,
  shiftHours: number,
): { amountLeft: number; amountProjected: number } {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = (hash * 31 + memberId.charCodeAt(i)) | 0;
  }
  const limit = MOCK_PAUSCHALE_LIMITS[type];
  const usedFraction = (Math.abs(hash) % 90) / 100;
  const amountUsed = Math.round(limit * usedFraction);
  const shiftAmount = Math.round(getEffectivePauschaleRate(type) * shiftHours);
  return {
    amountLeft: limit - amountUsed,
    amountProjected: limit - (amountUsed + shiftAmount),
  };
}
