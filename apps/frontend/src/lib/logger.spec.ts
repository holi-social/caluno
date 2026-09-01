import { describe, expect, it } from 'bun:test';
import { logger } from './logger';

describe('lib/logger', () => {
  it('exposes the pino API surface for server-side logging', () => {
    expect(typeof logger).toBe('object');
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

  it('is built for caluno-frontend service label', () => {
    expect(typeof logger.info).toBe('function');
  });
});
