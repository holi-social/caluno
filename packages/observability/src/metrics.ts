import { metrics as sentryMetrics } from '@sentry/core';

/** Structured key/value data attached to a metric, used for grouping/filtering. */
export type MetricAttributes = Record<string, string | number | boolean>;

/**
 * Application metrics facade — the single integration point between app code
 * and the metrics backend (currently Sentry). To switch providers (e.g.
 * PostHog), reimplement these three functions; call sites do not change.
 *
 * No-ops when the Sentry SDK is disabled (no DSN configured).
 */
export const metrics = {
  /** Increment a counter (e.g. user actions, events processed). */
  count(name: string, value = 1, attributes?: MetricAttributes): void {
    sentryMetrics.count(name, value, { attributes });
  },
  /** Track a measured value's distribution (e.g. response times, payload sizes). */
  distribution(
    name: string,
    value: number,
    attributes?: MetricAttributes,
  ): void {
    sentryMetrics.distribution(name, value, { attributes });
  },
  /** Report a current level (e.g. queue depth, active sessions). */
  gauge(name: string, value: number, attributes?: MetricAttributes): void {
    sentryMetrics.gauge(name, value, { attributes });
  },
};
