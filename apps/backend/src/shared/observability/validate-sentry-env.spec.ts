import { validateSentryEnv } from './validate-sentry-env';

describe('validateSentryEnv', () => {
  it('passes with no Sentry vars (local dev)', () => {
    expect(validateSentryEnv({})).toEqual({});
  });
  it('passes with valid values', () => {
    const config = {
      SENTRY_DSN: 'https://key@o0.ingest.de.sentry.io/0',
      SENTRY_ENVIRONMENT: 'staging',
      SENTRY_RELEASE: 'abc123',
      SENTRY_TRACES_SAMPLE_RATE: '0.5',
    };
    expect(validateSentryEnv(config)).toEqual(config);
  });
  it('rejects a malformed DSN', () => {
    expect(() => validateSentryEnv({ SENTRY_DSN: 'not-a-url' })).toThrow(
      'SENTRY_DSN',
    );
  });
  it('does not echo the malformed DSN value in the error', () => {
    expect(() => validateSentryEnv({ SENTRY_DSN: 'not-a-url' })).toThrow(
      'SENTRY_DSN is not a valid URL',
    );
    expect(() => validateSentryEnv({ SENTRY_DSN: 'not-a-url' })).not.toThrow(
      'not-a-url',
    );
  });
  it('rejects an out-of-range sample rate', () => {
    expect(() => validateSentryEnv({ SENTRY_TRACES_SAMPLE_RATE: '2' })).toThrow(
      'SENTRY_TRACES_SAMPLE_RATE',
    );
  });
});
