import { describe, expect, it } from 'bun:test';
import type { ErrorEvent } from '@sentry/core';
import { scrubEvent } from './scrub';

describe('scrubEvent', () => {
  it('filters sensitive request headers and drops cookies', () => {
    const event = {
      request: {
        headers: {
          Authorization: 'Bearer secret',
          Cookie: 'session=abc',
          'Content-Type': 'application/json',
        },
        cookies: { session: 'abc' },
      },
    } as unknown as ErrorEvent;
    const result = scrubEvent(event);
    expect(result.request?.headers?.Authorization).toBe('[Filtered]');
    expect(result.request?.headers?.Cookie).toBe('[Filtered]');
    expect(result.request?.headers?.['Content-Type']).toBe('application/json');
    expect(result.request?.cookies).toBeUndefined();
  });
  it('strips user down to the id', () => {
    const event = {
      user: {
        id: 'u1',
        email: 'a@b.c',
        ip_address: '1.2.3.4',
        username: 'anna',
      },
    } as unknown as ErrorEvent;
    expect(scrubEvent(event).user).toEqual({ id: 'u1' });
  });
});
