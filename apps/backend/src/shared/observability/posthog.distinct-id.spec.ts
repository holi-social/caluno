import { createHmac } from 'node:crypto';
import { createDailyDistinctId } from './posthog.service';

function hmac(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

describe('createDailyDistinctId', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('HMACs userId and the Europe/Berlin calendar date with the passed secret', () => {
    // 10:00 UTC on 20 Aug is 12:00 in Berlin (CEST).
    expect(createDailyDistinctId('user-1', 'test-secret')).toBe(
      hmac('test-secret', 'user-1:2026-08-20'),
    );
  });

  it('uses the Berlin date when UTC is still the previous day', () => {
    jest.setSystemTime(new Date('2026-08-19T22:30:00.000Z'));
    expect(createDailyDistinctId('user-1', 'test-secret')).toBe(
      hmac('test-secret', 'user-1:2026-08-20'),
    );
  });

  it('returns a different distinctId for a different user on the same day', () => {
    expect(createDailyDistinctId('user-1', 'test-secret')).not.toBe(
      createDailyDistinctId('user-2', 'test-secret'),
    );
  });

  it('returns a different distinctId for the same user on a different day', () => {
    const tuesday = createDailyDistinctId('user-1', 'test-secret');
    jest.setSystemTime(new Date('2026-08-21T10:00:00.000Z'));
    expect(createDailyDistinctId('user-1', 'test-secret')).not.toBe(tuesday);
  });

  it('returns a different distinctId when the secret changes', () => {
    expect(createDailyDistinctId('user-1', 'secret-a')).not.toBe(
      createDailyDistinctId('user-1', 'secret-b'),
    );
  });
});
