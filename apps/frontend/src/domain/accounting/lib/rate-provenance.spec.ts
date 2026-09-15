import { describe, expect, it } from 'bun:test';
import { RateProvenanceKind } from '@repo/data';
import type { RawEffectiveRate } from '@repo/data/react';
import { resolveRateDisplay } from './rate-provenance';

const PLATFORM_DEFAULT_CENTS = 500;

function display(
  hourlyRateCents: number,
  provenance: RawEffectiveRate['provenance'],
) {
  return resolveRateDisplay({
    platformDefaultRateCents: PLATFORM_DEFAULT_CENTS,
    effectiveRate: { hourlyRateCents, provenance } as RawEffectiveRate,
  });
}

describe('resolveRateDisplay', () => {
  it('names the unit or organisation an inherited rate comes from', () => {
    const result = display(1000, {
      kind: RateProvenanceKind.Inherited,
      sourceName: 'Hauptverein',
      replacesRateCents: null,
    });

    expect(result.rateCents).toBe(1000);
    expect(result.line).toEqual({
      kind: 'inheritedFrom',
      source: 'Hauptverein',
    });
  });

  it('names what an own rate replaces', () => {
    const result = display(1200, {
      kind: RateProvenanceKind.Own,
      sourceName: 'Hauptverein',
      replacesRateCents: 1000,
    });

    expect(result.rateCents).toBe(1200);
    expect(result.line).toEqual({
      kind: 'replaces',
      source: 'Hauptverein',
      rateCents: 1000,
    });
  });

  it('keeps the line for an own rate equal to the rate it replaces', () => {
    const result = display(1000, {
      kind: RateProvenanceKind.Own,
      sourceName: 'Hauptverein',
      replacesRateCents: 1000,
    });

    expect(result.line).toEqual({
      kind: 'replaces',
      source: 'Hauptverein',
      rateCents: 1000,
    });
  });

  it('reads an own rate over the platform default as replacing the default', () => {
    const result = display(1000, {
      kind: RateProvenanceKind.Own,
      sourceName: null,
      replacesRateCents: PLATFORM_DEFAULT_CENTS,
    });

    expect(result.line).toEqual({
      kind: 'replacesDefault',
      rateCents: PLATFORM_DEFAULT_CENTS,
    });
  });

  it('adds no line for the platform default', () => {
    const result = display(PLATFORM_DEFAULT_CENTS, {
      kind: RateProvenanceKind.Default,
      sourceName: null,
      replacesRateCents: null,
    });

    expect(result.line).toBeNull();
  });

  it('falls back to the platform default while rates are unavailable', () => {
    const result = resolveRateDisplay({
      platformDefaultRateCents: PLATFORM_DEFAULT_CENTS,
    });

    expect(result.rateCents).toBe(PLATFORM_DEFAULT_CENTS);
    expect(result.line).toBeNull();
  });
});
