import { describe, expect, it } from 'bun:test';
import { Writable } from 'node:stream';
import type { Logger } from 'pino';
import { createPinoLogger } from './pino';

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

describe('createPinoLogger', () => {
  it('emits Loki-friendly JSON in production: string level, service and env labels, redacted PII', () => {
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

  it('stays silent below production info level', () => {
    const { linesRaw, stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'production',
      stream,
    }) as Logger;

    logger.debug('should not appear');

    expect(linesRaw).toHaveLength(0);
  });

  it('emits debug logs in development', () => {
    const { linesRaw, stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'development',
      stream,
    }) as Logger;

    logger.debug('debugging');

    expect(linesRaw).toHaveLength(1);
  });

  it('stays silent in the test environment', () => {
    const { linesRaw, stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'test',
      stream,
    }) as Logger;

    logger.fatal('should not appear');

    expect(linesRaw).toHaveLength(0);
  });

  it('honours an explicit LOG_LEVEL override even in the test environment', () => {
    const { linesRaw, stream } = capture();
    const logger = createPinoLogger({
      service: 'caluno-frontend',
      nodeEnv: 'test',
      logLevel: 'debug',
      stream,
    }) as Logger;

    logger.debug('now visible');

    expect(linesRaw).toHaveLength(1);
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
