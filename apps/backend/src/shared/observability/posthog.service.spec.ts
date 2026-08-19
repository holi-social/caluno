import { Logger } from '@nestjs/common';
import { PostHogService } from './posthog.service';

describe('PostHogService', () => {
  const capture = jest.fn();
  const shutdown = jest.fn().mockResolvedValue(undefined);
  const client = { capture, shutdown };

  beforeEach(() => {
    capture.mockReset();
    shutdown.mockReset().mockResolvedValue(undefined);
  });

  it('delegates capture to the client with event, distinctId, properties, and groups', () => {
    const service = new PostHogService(client);
    service.capture({
      event: 'shift instance cancelled',
      distinctId: 'user-1',
      properties: { shiftInstanceId: 'si-1' },
      groups: { organization: 'org-1' },
    });
    expect(capture).toHaveBeenCalledWith({
      event: 'shift instance cancelled',
      distinctId: 'user-1',
      properties: { shiftInstanceId: 'si-1' },
      groups: { organization: 'org-1' },
    });
  });

  it('does not throw or call the client when no client is configured', () => {
    const service = new PostHogService(null);
    expect(() =>
      service.capture({ event: 'anything', distinctId: 'user-1' }),
    ).not.toThrow();
    expect(capture).not.toHaveBeenCalled();
  });

  it('does not throw when the client capture fails', () => {
    capture.mockImplementation(() => {
      throw new Error('network down');
    });
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const service = new PostHogService(client);
    expect(() =>
      service.capture({ event: 'anything', distinctId: 'user-1' }),
    ).not.toThrow();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('shuts down the client on application shutdown', async () => {
    const service = new PostHogService(client);
    await service.onApplicationShutdown();
    expect(shutdown).toHaveBeenCalled();
  });
});
