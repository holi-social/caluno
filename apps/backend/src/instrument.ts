// Imported first in main.ts — before Nest — so OpenTelemetry can patch
// http/db drivers. Keep this file free of other app imports.

import { buildBaseOptions } from '@repo/observability';
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  ...buildBaseOptions({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRateOverride: process.env.SENTRY_TRACES_SAMPLE_RATE,
  }),
});
