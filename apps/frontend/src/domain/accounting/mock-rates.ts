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

// Statutory annual limit per Pauschale type (§3 Nr. 26/26a EStG) — fixed by law, not
// org-configurable, unlike the hourly rate above. Mirrors `PauschalenType.yearlyLimitCents`
// in data-model.md.
export const YEARLY_LIMIT_EUR: Record<PauschalenType, number> = {
  ehrenamt: 840,
  uebungleiter: 3000,
};

export function getYearlyLimit(type: PauschalenType): number {
  return YEARLY_LIMIT_EUR[type];
}
