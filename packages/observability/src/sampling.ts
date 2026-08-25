import type { SamplingContext } from '@sentry/core';
import {
  DEFAULT_TRACES_SAMPLE_RATES,
  type SentryEnvironment,
} from './environments';

const IGNORED_TRANSACTION_PATTERNS: RegExp[] = [
  /\/api\/health/,
  /healthz/,
  /readiness/,
  /favicon\.ico/,
];

export function parseSampleRate(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') {
    return undefined;
  }
  const rate = Number.parseFloat(raw);
  if (Number.isNaN(rate) || rate < 0 || rate > 1) {
    return undefined;
  }
  return rate;
}

export function createTracesSampler(options: {
  environment: SentryEnvironment;
  override?: string;
}): (samplingContext: SamplingContext) => number {
  const overrideRate = parseSampleRate(options.override);
  return (samplingContext) => {
    const name = samplingContext.name ?? '';
    // Health-check/noise drops win over everything, including an upstream
    // sampling decision.
    if (IGNORED_TRANSACTION_PATTERNS.some((pattern) => pattern.test(name))) {
      return 0;
    }
    const rate =
      overrideRate ?? DEFAULT_TRACES_SAMPLE_RATES[options.environment];
    // Respect the upstream (distributed trace) sampling decision so continued
    // traces stay complete instead of being re-sampled at the local rate.
    if (typeof samplingContext.parentSampled === 'boolean') {
      return samplingContext.parentSampled ? rate : 0;
    }
    return rate;
  };
}
