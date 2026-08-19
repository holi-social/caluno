import {
  buildBaseOptions,
  TRACE_PROPAGATION_TARGETS,
} from '@repo/observability';
import * as Sentry from '@sentry/nextjs';

const replayEnabled = process.env.NEXT_PUBLIC_SENTRY_REPLAY_ENABLED === 'true';

Sentry.init({
  ...buildBaseOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    tracesSampleRateOverride: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  }),
  tracePropagationTargets: TRACE_PROPAGATION_TARGETS,
  integrations: [
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
