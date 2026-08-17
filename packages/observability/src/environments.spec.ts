import { describe, expect, it } from 'bun:test';
import {
  DEFAULT_TRACES_SAMPLE_RATES,
  resolveSentryEnvironment,
} from './environments';

describe('resolveSentryEnvironment', () => {
  it('uses an explicit valid environment', () => {
    expect(resolveSentryEnvironment('staging', 'production')).toBe('staging');
  });
  it('falls back to production when NODE_ENV=production', () => {
    expect(resolveSentryEnvironment(undefined, 'production')).toBe(
      'production',
    );
  });
  it('falls back to development otherwise', () => {
    expect(resolveSentryEnvironment(undefined, 'development')).toBe(
      'development',
    );
  });
  it('ignores invalid explicit values', () => {
    expect(resolveSentryEnvironment('qa', 'production')).toBe('production');
  });
  it('has a default sample rate for every environment', () => {
    expect(DEFAULT_TRACES_SAMPLE_RATES.development).toBe(1.0);
    expect(DEFAULT_TRACES_SAMPLE_RATES.staging).toBe(0.5);
    expect(DEFAULT_TRACES_SAMPLE_RATES.production).toBe(0.1);
  });
});
