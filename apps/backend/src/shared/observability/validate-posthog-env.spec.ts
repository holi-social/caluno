import { validatePostHogEnv } from './validate-posthog-env';

describe('validatePostHogEnv', () => {
  it('passes with no PostHog vars', () => {
    expect(validatePostHogEnv({})).toEqual({});
  });

  it('passes with a valid host', () => {
    const config = {
      POSTHOG_API_KEY: 'phc_test',
      POSTHOG_HOST: 'https://eu.i.posthog.com',
    };
    expect(validatePostHogEnv(config)).toEqual(config);
  });

  it('rejects a malformed host without echoing it', () => {
    expect(() => validatePostHogEnv({ POSTHOG_HOST: 'not-a-url' })).toThrow(
      'POSTHOG_HOST is not a valid URL',
    );
    expect(() => validatePostHogEnv({ POSTHOG_HOST: 'not-a-url' })).not.toThrow(
      'not-a-url',
    );
  });
});
