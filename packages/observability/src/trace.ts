/**
 * Origins that receive `sentry-trace` / `baggage` headers for distributed
 * tracing. Keep in sync with the deployed backend origins.
 */
export const TRACE_PROPAGATION_TARGETS: (string | RegExp)[] = [
  'localhost:8080',
  /^https:\/\/staging\.api\.caluno\.org/,
  /^https:\/\/api\.caluno\.org/,
];
