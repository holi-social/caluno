'use client';

import * as Sentry from '@sentry/nextjs';

/** Single entry point for reporting render-boundary errors to Sentry. */
export function reportError(error: Error & { digest?: string }): void {
  Sentry.captureException(error);
}
