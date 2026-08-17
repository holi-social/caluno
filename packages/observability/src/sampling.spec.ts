import { describe, expect, it } from 'bun:test';
import { createTracesSampler, parseSampleRate } from './sampling';

describe('parseSampleRate', () => {
  it('parses valid rates', () => {
    expect(parseSampleRate('0.25')).toBe(0.25);
  });
  it('returns undefined for missing/invalid/out-of-range values', () => {
    expect(parseSampleRate(undefined)).toBeUndefined();
    expect(parseSampleRate('')).toBeUndefined();
    expect(parseSampleRate('abc')).toBeUndefined();
    expect(parseSampleRate('1.5')).toBeUndefined();
    expect(parseSampleRate('-0.1')).toBeUndefined();
  });
});

describe('createTracesSampler', () => {
  it('drops health-check and noisy routes', () => {
    const sampler = createTracesSampler({ environment: 'production' });
    expect(sampler({ name: 'GET /api/health' } as never)).toBe(0);
    expect(sampler({ name: 'GET /readiness' } as never)).toBe(0);
  });
  it('uses the per-environment default', () => {
    const sampler = createTracesSampler({ environment: 'production' });
    expect(sampler({ name: 'POST /graphql' } as never)).toBe(0.1);
  });
  it('honours the env override for kept routes', () => {
    const sampler = createTracesSampler({
      environment: 'production',
      override: '0.9',
    });
    expect(sampler({ name: 'POST /graphql' } as never)).toBe(0.9);
    expect(sampler({ name: 'GET /api/health' } as never)).toBe(0);
  });
  it('keeps continued traces at the env rate when the parent was sampled', () => {
    const sampler = createTracesSampler({ environment: 'production' });
    expect(
      sampler({ name: 'POST /graphql', parentSampled: true } as never),
    ).toBe(0.1);
  });
  it('drops continued traces when the parent was not sampled', () => {
    const sampler = createTracesSampler({ environment: 'production' });
    expect(
      sampler({ name: 'POST /graphql', parentSampled: false } as never),
    ).toBe(0);
  });
  it('drops ignored routes even when the parent was sampled', () => {
    const sampler = createTracesSampler({ environment: 'production' });
    expect(
      sampler({ name: 'GET /api/health', parentSampled: true } as never),
    ).toBe(0);
  });
});
