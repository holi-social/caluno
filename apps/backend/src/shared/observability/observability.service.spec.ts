import { ObservabilityService } from './observability.service';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
  startSpan: jest.fn((_opts, cb) => cb('span')),
  setUser: jest.fn(),
  withIsolationScope: jest.fn((cb) => cb()),
}));

const Sentry = jest.requireMock('@sentry/nestjs');

describe('ObservabilityService', () => {
  const service = new ObservabilityService();

  it('delegates captureException', () => {
    const error = new Error('boom');
    service.captureException(error);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('delegates startSpan', () => {
    const result = service.startSpan({ name: 'op' }, (span) => span);
    expect(Sentry.startSpan).toHaveBeenCalled();
    expect(result).toBe('span');
  });

  it('delegates setUser', () => {
    service.setUser({ id: 'u1' });
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('delegates withIsolationScope', () => {
    const result = service.withIsolationScope(() => 42);
    expect(Sentry.withIsolationScope).toHaveBeenCalled();
    expect(result).toBe(42);
  });
});
