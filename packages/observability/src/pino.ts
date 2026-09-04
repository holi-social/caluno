import type {
  DestinationStream,
  Level,
  LevelWithSilent,
  Logger,
  LoggerOptions,
} from 'pino';
import * as pino from 'pino';

/**
 * Shared pino core for all Caluno services that emit structured JSON to
 * stdout (the source consumed by Loki on Scaleway).
 *
 * Two layers build on this:
 * - `createPinoLogger` (plain pino instance) — used by the frontend server
 *   runtime (server components/actions/routes).
 * - The backend's HTTP request logger (`buildPinoHttpOptions` in
 *   `apps/backend/src/shared/observability/pino-options.ts`) — spreads the
 *   shared core and adds pino-http request/response serialization.
 *
 * Runtime scope: server only. Browser logs cannot reach Loki because only the
 * container's stdout is collected, so client code must keep using Sentry for
 * error reporting and must not import this module (it pulls in the Node pino
 * build).
 *
 * Output contract (consistent across the whole monorepo):
 * - Every record carries `service` (per-call name) and `env` so Loki can
 *   filter by service/environment, plus `level` as a string ("info") rather
 *   than pino's numeric code.
 * - JSON on stdout in production/staging for Loki; human-readable pretty
 *   printing locally; test runs stay silent.
 * - `redact` strips common PII (credentials, tokens, contact details) from
 *   application-level payloads. It cannot reach inside string values, so
 *   callers must still mask PII before interpolating them into messages.
 */

const PRODUCTION_ENVIRONMENTS = new Set(['production', 'staging']);

const PINO_LEVELS = new Set<LevelWithSilent>([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

export interface SharedPinoOptionsInput {
  /** Service name reported in the `service` label, e.g. "caluno-frontend". */
  service: string;
  /** NODE_ENV value; drives level, transport and the `env` label. */
  nodeEnv?: string;
  /** Explicit LOG_LEVEL override (a pino level name). */
  logLevel?: string;
}

/**
 * The pino option fields shared by every Caluno logger: level selection,
 * service/env base labels, the Loki-friendly string `level` formatter, the
 * transport (pretty in dev, JSON/silent otherwise) and the shared redaction
 * paths. Consumer-specific options (request serializers, transport deltas)
 * are merged on top by the field that builds the concrete logger.
 */
export interface SharedPinoOptions {
  level: LevelWithSilent;
  base: { service: string; env: string };
  formatters: { level: (label: string) => { level: Level } };
  transport?: LoggerOptions['transport'];
  redact: { paths: string[]; censor: string };
}

/** Shared PII redaction paths for application-level log payloads. */
export const PINO_REDACT_PATHS = [
  // Credentials.
  'authorization',
  '*.authorization',
  'password',
  '*.password',
  'token',
  '*.token',
  'otp',
  '*.otp',
  'apiKey',
  '*.apiKey',
  'secret',
  '*.secret',
  // Contact PII. (Only exact paths and single-level wildcards are matched.)
  'email',
  '*.email',
  'phone',
  '*.phone',
  'user.email',
  'user.name',
] as const;

/**
 * Resolve the pino option fields shared by every Caluno logger.
 *
 * In staging/release/production the logger writes JSON to stdout (Loki-ready). Locally
 * it uses `pino-pretty` for readable output; in test it is silent. Consumers
 * that write to a custom stream (tests) pass `transport: false` to skip the
 * pretty transport so records arrive as raw JSON.
 */
export function buildSharedPinoOptions(
  input: SharedPinoOptionsInput,
  transportEnabled = true,
): SharedPinoOptions {
  const nodeEnv = input.nodeEnv ?? 'development';
  const isProduction = PRODUCTION_ENVIRONMENTS.has(nodeEnv);
  const isTest = nodeEnv === 'test';
  const configuredLevel = PINO_LEVELS.has(input.logLevel as LevelWithSilent)
    ? (input.logLevel as LevelWithSilent)
    : undefined;

  const level: LevelWithSilent = isTest
    ? (configuredLevel ?? 'silent')
    : (configuredLevel ?? (isProduction ? 'info' : 'debug'));

  const usePretty = transportEnabled && !isProduction && !isTest;

  return {
    level,
    base: {
      service: input.service,
      env: nodeEnv,
    },
    formatters: {
      // Loki-friendly string level ("info") instead of pino's numeric code.
      level: (label) => ({ level: label as Level }),
    },
    transport: usePretty
      ? { target: 'pino-pretty', options: { singleLine: true } }
      : undefined,
    redact: {
      paths: [...PINO_REDACT_PATHS],
      censor: '[Redacted]',
    },
  };
}

export type PinoLogger = Logger;

export interface PinoLoggerInput extends SharedPinoOptionsInput {
  /**
   * Destination for the generated records. Defaults to stdout. Tests inject a
   * capturing stream so they can assert on the exact emitted JSON. Providing
   * a stream also skips the pretty transport (streams are raw).
   */
  stream?: DestinationStream;
  /**
   * Use the human-readable `pino-pretty` transport in development. Defaults to
   * `true`. Runtimes that cannot spawn pino's worker transport (e.g. Next.js
   * under Turbopack in dev) must set this to `false` to emit raw Loki-ready
   * JSON on stdout instead of crashing.
   */
  pretty?: boolean;
}

/**
 * Build a plain pino logger for the given service (no HTTP request layer).
 *
 * In production/staging the logger writes JSON to stdout (Loki-ready). Locally
 * it uses `pino-pretty` for readable output unless disabled via `pretty`; in
 * test it is silent. Passing a custom `stream` (tests) writes raw JSON and
 * skips the pretty transport.
 */
export function createPinoLogger(input: PinoLoggerInput): Logger {
  const options: LoggerOptions = buildSharedPinoOptions(
    {
      service: input.service,
      nodeEnv: input.nodeEnv,
      logLevel: input.logLevel,
    },
    !input.stream && input.pretty !== false,
  );
  return pino.pino(options, input.stream);
}
