/**
 * Minimal env validation for the Sentry variables, wired into
 * ConfigModule.forRoot({ validate }). Missing vars are fine (SDK stays
 * inert); present-but-malformed vars fail fast at boot.
 */
export function validateSentryEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const dsn = config.SENTRY_DSN;
  if (typeof dsn === 'string' && dsn !== '') {
    try {
      new URL(dsn);
    } catch {
      throw new Error(`SENTRY_DSN is not a valid URL: ${dsn}`);
    }
  }
  const rate = config.SENTRY_TRACES_SAMPLE_RATE;
  if (typeof rate === 'string' && rate !== '') {
    const parsed = Number.parseFloat(rate);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
      throw new Error(
        `SENTRY_TRACES_SAMPLE_RATE must be a number between 0 and 1, got: ${rate}`,
      );
    }
  }
  return config;
}
