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
  ehrenamt: 840,
  uebungleiter: 3000,
};
