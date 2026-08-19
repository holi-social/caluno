import { buildBaseOptions } from '@repo/observability';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  ...buildBaseOptions({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment:
      process.env.SENTRY_ENVIRONMENT ??
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRateOverride: process.env.SENTRY_TRACES_SAMPLE_RATE,
  }),
});
