/**
 * Minimal env validation for PostHog variables, composed with Sentry
 * validation in ConfigModule.forRoot({ validate }). Missing vars are fine
 * (capture stays a no-op); present-but-malformed host fails fast at boot.
 */
export function validatePostHogEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const host = config.POSTHOG_HOST;
  if (typeof host === 'string' && host !== '') {
    try {
      new URL(host);
    } catch {
      throw new Error('POSTHOG_HOST is not a valid URL');
    }
  }
  return config;
}
