import * as Sentry from '@sentry/nestjs';
import { ObservabilityService } from './observability.service';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
  startSpan: jest.fn((_opts: unknown, cb: (span: string) => unknown) =>
    cb('span'),
  ),
  setUser: jest.fn(),
  withIsolationScope: jest.fn((cb: () => unknown) => cb()),
}));

const captureException = Sentry.captureException as jest.Mock;
const startSpan = Sentry.startSpan as jest.Mock;
const setUser = Sentry.setUser as jest.Mock;
const withIsolationScope = Sentry.withIsolationScope as jest.Mock;

describe('ObservabilityService', () => {
  const service = new ObservabilityService();

  it('delegates captureException', () => {
    const error = new Error('boom');
    service.captureException(error);
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('delegates startSpan', () => {
    const result = service.startSpan({ name: 'op' }, (span) => span);
    expect(startSpan).toHaveBeenCalled();
    expect(result).toBe('span');
  });

  it('delegates setUser', () => {
    service.setUser({ id: 'u1' });
    expect(setUser).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('delegates withIsolationScope', () => {
    const result = service.withIsolationScope(() => 42);
    expect(withIsolationScope).toHaveBeenCalled();
    expect(result).toBe(42);
  });
});
