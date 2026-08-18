import {
  buildBaseOptions,
  TRACE_PROPAGATION_TARGETS,
} from '@repo/observability';
import * as Sentry from '@sentry/nextjs';

const replayEnabled = process.env.NEXT_PUBLIC_SENTRY_REPLAY_ENABLED === 'true';
// Share of browser sessions to profile (0..1). Default off; UI profiling only
// runs while a sampled trace is active (`profileLifecycle: 'trace'`).
const profileSessionSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? 0,
);

Sentry.init({
  ...buildBaseOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    tracesSampleRateOverride: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  }),
  tracePropagationTargets: TRACE_PROPAGATION_TARGETS,
  // Metrics are backend-only — never emit them from the browser.
  enableMetrics: false,
  profileSessionSampleRate,
  profileLifecycle: 'trace',
  integrations: [
    ...(profileSessionSampleRate > 0
      ? [Sentry.browserProfilingIntegration()]
      : []),
    ...(replayEnabled
      ? [
          Sentry.replayIntegration({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
          }),
        ]
      : []),
  ],
  // Only sampled when replay is enabled above; safe defaults otherwise.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
