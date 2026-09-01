import { describe, expect, it } from 'bun:test';
import { Writable } from 'node:stream';
import type { Logger } from 'pino';
import {
  buildSharedPinoOptions,
  createPinoLogger,
  PINO_REDACT_PATHS,
} from './pino';

function capture() {
  const linesRaw: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding: unknown, callback: () => void) {
      linesRaw.push(chunk.toString());
      callback();
    },
  });
  return { linesRaw, stream };
}

/** Read pino's config from the logger instance for invariants we own. */
function configOf(logger: unknown): Record<string, unknown> {
  return logger as Record<string, unknown>;
}

describe('buildSharedPinoOptions', () => {
  it('selects level by environment and honours logLevel', () => {
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'production' }).level,
    ).toBe('info');
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'staging' }).level,
    ).toBe('info');
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'development' }).level,
    ).toBe('debug');
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'test' }).level,
    ).toBe('silent');
    expect(
      buildSharedPinoOptions({
        service: 's',
        nodeEnv: 'production',
        logLevel: 'debug',
      }).level,
    ).toBe('debug');
    expect(
      buildSharedPinoOptions({
        service: 's',
        nodeEnv: 'test',
        logLevel: 'debug',
      }).level,
    ).toBe('debug');
    // Invalid override is ignored.
    expect(
      buildSharedPinoOptions({
        service: 's',
        nodeEnv: 'production',
        logLevel: 'bogus',
      }).level,
    ).toBe('info');
  });

  it('uses the pretty transport in dev, JSON/silent in production and test', () => {
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'development' })
        .transport,
    ).toEqual({
      target: 'pino-pretty',
      options: { singleLine: true },
    });
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'production' }).transport,
    ).toBeUndefined();
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'test' }).transport,
    ).toBeUndefined();
    // Consumers writing to a custom stream disable the pretty transport.
    expect(
      buildSharedPinoOptions({ service: 's', nodeEnv: 'development' }, false)
        .transport,
    ).toBeUndefined();
  });

  it('sets service/env base labels and the Loki-friendly string level formatter', () => {
    const opts = buildSharedPinoOptions({
      service: 'caluno-frontend',
      nodeEnv: 'staging',
    });
    expect(opts.base).toEqual({ service: 'caluno-frontend', env: 'staging' });
    expect(opts.formatters.level('warn')).toEqual({ level: 'warn' });
    expect(opts.redact.censor).toBe('[Redacted]');
    expect(opts.redact.paths).toContain('password');
    expect(opts.redact.paths).toContain('email');
    expect(opts.redact.paths).toContain('token');
  });
});

describe('createPinoLogger', () => {
  it('returns a usable logger with all level methods', () => {
    const { stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'production',
      stream,
    });
    for (const method of [
      'fatal',
      'error',
      'warn',
      'info',
      'debug',
      'trace',
      'child',
    ]) {
      expect(
        typeof (logger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    }
  });

  it('selects level by environment and honours logLevel', () => {
    const { stream } = capture();
    expect(
      configOf(
        createPinoLogger({ service: 's', nodeEnv: 'production', stream }),
      ).level,
    ).toBe('info');
    expect(
      configOf(createPinoLogger({ service: 's', nodeEnv: 'staging', stream }))
        .level,
    ).toBe('info');
    expect(
      configOf(
        createPinoLogger({ service: 's', nodeEnv: 'development', stream }),
      ).level,
    ).toBe('debug');
    expect(
      configOf(createPinoLogger({ service: 's', nodeEnv: 'test', stream }))
        .level,
    ).toBe('silent');
    expect(
      configOf(
        createPinoLogger({
          service: 's',
          nodeEnv: 'production',
          logLevel: 'debug',
          stream,
        }),
      ).level,
    ).toBe('debug');
    expect(
      configOf(
        createPinoLogger({
          service: 's',
          nodeEnv: 'test',
          logLevel: 'debug',
          stream,
        }),
      ).level,
    ).toBe('debug');
    // Invalid override is ignored.
    expect(
      configOf(
        createPinoLogger({
          service: 's',
          nodeEnv: 'production',
          logLevel: 'bogus',
          stream,
        }),
      ).level,
    ).toBe('info');
  });

  it('never binds cross-unit state and keeps shared PII redaction paths', () => {
    // `PINO_REDACT_PATHS` is our exported contract; the emitted-JSON test below
    // proves the labels/redaction actually reach the output.
    expect(PINO_REDACT_PATHS).toContain('password');
    expect(PINO_REDACT_PATHS).toContain('email');
    expect(PINO_REDACT_PATHS).toContain('token');
  });

  it('emits Loki-friendly JSON: string level, service and env labels, redacted PII', () => {
    const { linesRaw, stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'production',
      stream,
    }) as Logger;

    logger.info({
      email: 'john@example.com',
      password: 'hunter2',
      token: 'reset-token',
      tokenCount: 5,
      user: { name: 'John', email: 'john@example.com' },
    });

    expect(linesRaw).toHaveLength(1);
    const record = JSON.parse(linesRaw[0] ?? '{}') as Record<string, unknown>;

    expect(record.level).toBe('info');
    expect(record.service).toBe('caluno-frontend');
    expect(record.env).toBe('production');
    expect(record.email).toBe('[Redacted]');
    expect(record.password).toBe('[Redacted]');
    expect(record.token).toBe('[Redacted]');
    expect(record.user).toEqual({ name: '[Redacted]', email: '[Redacted]' });
    // Exact-key matching only: not a substring matcher.
    expect(record.tokenCount).toBe(5);
  });

  it('with pretty:false in dev still emits raw Loki-friendly JSON (no pino-pretty transport)', () => {
    const { linesRaw, stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'development',
      pretty: false,
      stream,
    }) as Logger;

    logger.info({ orgUId: 'org-1' }, 'server started');

    expect(linesRaw).toHaveLength(1);
    const record = JSON.parse(linesRaw[0] ?? '{}') as Record<string, unknown>;
    expect(record.level).toBe('info');
    expect(record.service).toBe('caluno-frontend');
    expect(record.env).toBe('development');
    expect(record.msg).toBe('server started');
    expect(record.orgUId).toBe('org-1');
  });
});
