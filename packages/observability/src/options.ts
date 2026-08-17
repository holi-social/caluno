import type { ClientOptions, ErrorEvent, TransactionEvent } from '@sentry/core';
import { resolveSentryEnvironment } from './environments';
import { IGNORE_ERRORS } from './ignore-errors';
import { createTracesSampler } from './sampling';
import { scrubEvent } from './scrub';

export interface BaseOptionsInput {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRateOverride?: string;
}

/** The subset of Sentry options shared by both apps. */
export type SharedSentryOptions = Pick<
  ClientOptions,
  | 'dsn'
  | 'enabled'
  | 'environment'
  | 'release'
  | 'sendDefaultPii'
  | 'ignoreErrors'
  | 'tracesSampler'
  | 'beforeSend'
  | 'beforeSendTransaction'
>;

export function buildBaseOptions(input: BaseOptionsInput): SharedSentryOptions {
  const environment = resolveSentryEnvironment(input.environment);
  return {
    dsn: input.dsn,
    // No DSN -> fully inert SDK (local dev stays Sentry-free).
    enabled: Boolean(input.dsn),
    environment,
    release: input.release,
    sendDefaultPii: false,
    ignoreErrors: IGNORE_ERRORS,
    tracesSampler: createTracesSampler({
      environment,
      override: input.tracesSampleRateOverride,
    }),
    beforeSend: (event: ErrorEvent) => scrubEvent(event),
    beforeSendTransaction: (event: TransactionEvent) => scrubEvent(event),
  };
}
