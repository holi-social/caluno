import { describe, expect, it, mock } from 'bun:test';

const captureException = mock(() => 'event-id');
mock.module('@sentry/nextjs', () => ({ captureException }));

const { reportError } = await import('./report-error');

describe('reportError', () => {
  it('captures the exception via the Sentry SDK', () => {
    const error = new Error('boom') as Error & { digest?: string };
    reportError(error);
    expect(captureException).toHaveBeenCalledWith(error);
  });
});
