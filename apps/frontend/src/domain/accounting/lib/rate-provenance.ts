import { RateProvenanceKind } from '@repo/data';
import type { RawEffectiveRate } from '@repo/data/react';

/** The line under a rate saying where it comes from. */
export type RateLine =
  | { kind: 'inheritedFrom'; source: string }
  | { kind: 'replaces'; source: string; rateCents: number }
  | { kind: 'replacesDefault'; rateCents: number };

export interface RateDisplay {
  /** The rate that applies in this unit, in cents. */
  rateCents: number;
  /** Null for the platform default, which nothing set. */
  line: RateLine | null;
}

export function resolveRateDisplay({
  effectiveRate,
  platformDefaultRateCents,
}: {
  effectiveRate?: RawEffectiveRate;
  platformDefaultRateCents: number;
}): RateDisplay {
  if (!effectiveRate) {
    return { rateCents: platformDefaultRateCents, line: null };
  }
  return {
    rateCents: effectiveRate.hourlyRateCents,
    line: lineFor(effectiveRate.provenance),
  };
}

function lineFor({
  kind,
  sourceName,
  replacesRateCents,
}: RawEffectiveRate['provenance']): RateLine | null {
  if (kind === RateProvenanceKind.Inherited) {
    return sourceName ? { kind: 'inheritedFrom', source: sourceName } : null;
  }
  if (kind === RateProvenanceKind.Own && replacesRateCents != null) {
    // Shown even when equal to the rate in force: an own rate must never
    // read like an inherited one.
    return sourceName
      ? { kind: 'replaces', source: sourceName, rateCents: replacesRateCents }
      : { kind: 'replacesDefault', rateCents: replacesRateCents };
  }
  return null;
}
