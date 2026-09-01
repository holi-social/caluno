import type { PinoLogger } from '@repo/observability';
import { createPinoLogger } from '@repo/observability';

/**
 * Server-side structured logger for the Caluno frontend.
 *
 * Emits pino JSON to stdout in production/staging so Scaleway's log collection
 * can ship it to Loki, with `service: "caluno-frontend"` and `env` labels for
 * filtering, a string `level`, and PII redaction on application payloads.
 *
 * SERVER ONLY — never import this module from a Client Component. Browser logs
 * cannot reach Loki (only the container's stdout is collected), and pulling in
 * the Node pino build would break the client bundle. For client-side error
 * reporting keep using `@/lib/report-error` (Sentry).
 *
 * Use in server components, server actions and route handlers:
 *   import { logger } from '@/lib/logger';
 *   logger.info({ orgId }, 'rendered org dashboard');
 */
export const logger: PinoLogger = createPinoLogger({
  service: 'caluno-frontend',
  nodeEnv: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  pretty: false,
});
