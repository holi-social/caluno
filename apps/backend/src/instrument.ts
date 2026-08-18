// Imported first in main.ts — before Nest — so OpenTelemetry can patch
// http/db drivers. Keep this file free of other app imports.

import { buildBaseOptions } from '@repo/observability';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  ...buildBaseOptions({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRateOverride: process.env.SENTRY_TRACES_SAMPLE_RATE,
  }),
  integrations: (defaults) => [...defaults, nodeProfilingIntegration()],
  // Relative to transactions already sampled by tracesSampler — not absolute.
  profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 1),
});
