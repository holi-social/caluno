import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { buildSharedPinoOptions, PINO_REDACT_PATHS } from '@repo/observability';
import * as Sentry from '@sentry/nestjs';
import type { Options as PinoHttpOptions } from 'pino-http';

/**
 * pino-http options for the Caluno backend.
 *
 * The shared pino core (level selection, service/env base labels, Loki-friendly
 * string `level` formatter, transport, and the shared PII redaction paths) is
 * reused from `@repo/observability`. This file adds the pino-http-only layers:
 * request/response serialization, request-id generation and Sentry trace
 * correlation.
 *
 * Output contract (Loki consumes JSON from stdout):
 * - Every line carries `service: "caluno-backend"` and `env` so Loki can
 *   filter by service/environment, plus `level` as a string ("info"), and
 *   `reqId` / `trace_id` / `user_id` for correlation and alerting.
 *
 * PII policy — the request serializers are the *primary* control:
 * - Request bodies are never logged. In particular, GraphQL `variables`
 *   (arbitrary user data: emails, names, form answers, credentials) and the
 *   query text (which can embed PII as inlined literals) are never emitted;
 *   only the operation name is kept.
 * - The logged URL has its query string stripped (`?token=`, `?code=`,
 *   `?query=` for GraphQL GET).
 * - Only `host`, `user-agent` and `x-organization-unit-id` headers are kept.
 * - `redact` below extends the shared base with transport credentials; it is a
 *   second line of defence for application-level log payloads. It cannot
 *   redact inside string values (e.g. template-literal messages), so app code
 *   must still mask PII before interpolating it.
 */

/** Headers accepted as the caller-provided request id (Loki correlation). */
const REQUEST_ID_HEADERS = ['x-request-id', 'request-id'] as const;
const REQUEST_ID_MAX_LENGTH = 128;
// Restrict to URL-safe characters so a client-supplied value cannot inject
// control characters (log forging) into the log stream.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._~:-]+$/;

export interface PinoHttpOptionsInput {
  /** NODE_ENV value; drives level, transport and the `env` label. */
  nodeEnv?: string;
  /** Explicit LOG_LEVEL override (a pino level name). */
  logLevel?: string;
}

interface LoggableRequest {
  id?: unknown;
  method?: string;
  url?: string;
  headers?: IncomingHttpHeaders;
  /** Parsed query string (express), e.g. for GraphQL GET requests. */
  query?: Record<string, unknown>;
  body?: unknown;
  user?: { id?: string } | null;
  raw?: LoggableRequest;
}

function asRawRequest(req: LoggableRequest): LoggableRequest {
  return req.raw ?? req;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeUrl(url: string): string {
  // Query strings can carry secrets (?token=, ?code=) or inlined GraphQL
  // operations (?query=) — never send them to the logs.
  const queryIndex = url.indexOf('?');
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

function isGraphqlRequest(req: LoggableRequest): boolean {
  return (req.url ?? '').startsWith('/graphql');
}

function serializeRequest(req: LoggableRequest): Record<string, unknown> {
  const raw = asRawRequest(req);
  const serialized: Record<string, unknown> = {
    id: req.id,
    method: req.method,
    url: sanitizeUrl(req.url ?? ''),
    headers: {
      host: firstHeader(raw.headers?.host),
      'user-agent': firstHeader(raw.headers?.['user-agent']),
      'x-organization-unit-id': firstHeader(
        raw.headers?.['x-organization-unit-id'],
      ),
    },
  };

  if (isGraphqlRequest(raw)) {
    // POST bodies carry { operationName, query, variables }; GET requests
    // carry them in the query string (which is otherwise stripped from the
    // logged URL). Only the operation name is ever logged.
    const body = raw.body as { operationName?: string } | undefined;
    const queryOperationName =
      typeof raw.query?.operationName === 'string'
        ? raw.query.operationName
        : undefined;
    const operationName = body?.operationName ?? queryOperationName;
    if (operationName) {
      serialized.graphql = { operationName };
    }
  }
  return serialized;
}

// pino-http evaluates customProps once at request start and again when the
// response finishes, at which point the Sentry span may already be closed.
// Capture the trace id on first sight and reuse it for the response log.
const traceIdByRequest = new WeakMap<object, string | undefined>();

function sentryTraceId(req: LoggableRequest): string | undefined {
  const key: object = asRawRequest(req);
  const cached = traceIdByRequest.get(key);
  if (cached !== undefined) {
    return cached;
  }
  // Prefer the active span; fall back to the per-request propagation context
  // (both are set by the SDK before Nest middleware runs).
  const traceId =
    Sentry.getActiveSpan()?.spanContext().traceId ??
    Sentry.getCurrentScope().getPropagationContext().traceId;
  traceIdByRequest.set(key, traceId);
  return traceId;
}

function requestIdFromHeaders(req: LoggableRequest): string | undefined {
  const raw = asRawRequest(req);
  for (const header of REQUEST_ID_HEADERS) {
    const value = firstHeader(raw.headers?.[header]);
    if (
      value &&
      value.length <= REQUEST_ID_MAX_LENGTH &&
      REQUEST_ID_PATTERN.test(value)
    ) {
      return value;
    }
  }
  return undefined;
}

// pino-http transport credentials — the req serializer already drops these
// headers; kept as a second line of defence on top of the shared base.
const HTTP_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
];

export function buildPinoHttpOptions(
  input: PinoHttpOptionsInput = {},
): PinoHttpOptions {
  const shared = buildSharedPinoOptions({
    service: 'caluno-backend',
    nodeEnv: input.nodeEnv,
    logLevel: input.logLevel,
  });

  return {
    ...shared,
    genReqId: (req) => requestIdFromHeaders(req) ?? randomUUID(),
    customLogLevel: (_req, res, error) =>
      error || res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
          ? 'warn'
          : 'info',
    redact: {
      paths: [...HTTP_REDACT_PATHS, ...PINO_REDACT_PATHS],
      censor: '[Redacted]',
    },
    customProps: (req) => {
      const raw = asRawRequest(req);
      return {
        trace_id: sentryTraceId(raw),
        user_id: raw.user?.id,
      };
    },
    serializers: {
      req: (req) => serializeRequest(req),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  };
}
