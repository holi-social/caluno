import type { ErrorEvent, TransactionEvent } from '@sentry/core';

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
]);

/**
 * PII scrubbing applied on top of `sendDefaultPii: false` (defense in depth).
 * Filters credentials from request data and strips the user down to the id.
 * Applies to both error events and transactions (transactions carry request
 * headers/user context too).
 */
export function scrubEvent<T extends ErrorEvent | TransactionEvent>(
  event: T,
): T {
  if (event.request?.headers) {
    for (const name of Object.keys(event.request.headers)) {
      if (SENSITIVE_HEADER_NAMES.has(name.toLowerCase())) {
        event.request.headers[name] = '[Filtered]';
      }
    }
  }
  if (event.request) {
    delete event.request.cookies;
  }
  if (event.user) {
    event.user = { id: event.user.id };
  }
  return event;
}
