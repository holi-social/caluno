import { describe, expect, it, mock } from 'bun:test';
import { metrics } from './metrics';

const calls: Array<{ fn: string; args: unknown[] }> = [];
mock.module('@sentry/core', () => ({
  metrics: {
    count: (...args: unknown[]) => calls.push({ fn: 'count', args }),
    distribution: (...args: unknown[]) =>
      calls.push({ fn: 'distribution', args }),
    gauge: (...args: unknown[]) => calls.push({ fn: 'gauge', args }),
  },
}));

describe('metrics facade', () => {
  it('delegates count with default value 1', () => {
    metrics.count('user_action');
    expect(calls.at(-1)).toEqual({
      fn: 'count',
      args: ['user_action', 1, { attributes: undefined }],
    });
  });

  it('delegates distribution with attributes', () => {
    metrics.distribution('api_response_time', 150, { endpoint: '/graphql' });
    expect(calls.at(-1)).toEqual({
      fn: 'distribution',
      args: [
        'api_response_time',
        150,
        { attributes: { endpoint: '/graphql' } },
      ],
    });
  });

  it('delegates gauge', () => {
    metrics.gauge('queue_depth', 42);
    expect(calls.at(-1)).toEqual({
      fn: 'gauge',
      args: ['queue_depth', 42, { attributes: undefined }],
    });
  });
});
