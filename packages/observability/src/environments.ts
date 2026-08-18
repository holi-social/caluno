export const SENTRY_ENVIRONMENTS = [
  'development',
  'staging',
  'production',
] as const;
export type SentryEnvironment = (typeof SENTRY_ENVIRONMENTS)[number];

export function resolveSentryEnvironment(
  explicit?: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): SentryEnvironment {
  if (
    explicit === 'development' ||
    explicit === 'staging' ||
    explicit === 'production'
  ) {
    return explicit;
  }
  return nodeEnv === 'production' ? 'production' : 'development';
}

export const DEFAULT_TRACES_SAMPLE_RATES: Record<SentryEnvironment, number> = {
  development: 1.0,
  staging: 0.5,
  production: 0.1,
};
