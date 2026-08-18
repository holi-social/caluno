import { describe, expect, it } from 'bun:test';
import { isExpectedGraphqlCode } from './ignore-errors';
import { buildBaseOptions } from './options';
import { TRACE_PROPAGATION_TARGETS } from './trace';

describe('buildBaseOptions', () => {
  it('is disabled without a DSN and never sends default PII', () => {
    const opts = buildBaseOptions({});
    expect(opts.enabled).toBe(false);
    expect(opts.sendDefaultPii).toBe(false);
  });
  it('maps environment, release and dsn through', () => {
    const opts = buildBaseOptions({
      dsn: 'https://key@o0.ingest.de.sentry.io/0',
      environment: 'staging',
      release: 'abc123',
    });
    expect(opts.enabled).toBe(true);
    expect(opts.dsn).toBe('https://key@o0.ingest.de.sentry.io/0');
    expect(opts.environment).toBe('staging');
    expect(opts.release).toBe('abc123');
  });
});

describe('isExpectedGraphqlCode', () => {
  it('accepts expected domain codes', () => {
    expect(isExpectedGraphqlCode('FORBIDDEN')).toBe(true);
    expect(isExpectedGraphqlCode('NOT_FOUND')).toBe(true);
  });
  it('rejects unexpected codes', () => {
    expect(isExpectedGraphqlCode('INTERNAL_SERVER_ERROR')).toBe(false);
    expect(isExpectedGraphqlCode(undefined)).toBe(false);
  });
});

describe('TRACE_PROPAGATION_TARGETS', () => {
  it('matches the backend origins', () => {
    const matches = (url: string) =>
      TRACE_PROPAGATION_TARGETS.some((t) =>
        typeof t === 'string' ? url.includes(t) : t.test(url),
      );
    expect(matches('http://localhost:8080/graphql')).toBe(true);
    expect(matches('https://staging.api.caluno.org/graphql')).toBe(true);
    expect(matches('https://api.caluno.org/graphql')).toBe(true);
    expect(matches('https://example.com/graphql')).toBe(false);
  });
});
