import { Logger } from '@nestjs/common';
import {
  FORBIDDEN_POSTHOG_PROPERTY_KEYS,
  POSTHOG_EVENT,
  POSTHOG_EVENT_REGISTRY,
  POSTHOG_SURFACE,
} from './posthog.events';
import { createDailyDistinctId, PostHogService } from './posthog.service';

describe('PostHogService', () => {
  const capture = jest.fn();
  const shutdown = jest.fn().mockResolvedValue(undefined);
  const client = { capture, shutdown };

  beforeEach(() => {
    capture.mockReset();
    process.env.POSTHOG_DISTINCT_SECRET = 'test-secret';
    shutdown.mockReset().mockResolvedValue(undefined);
  });

  it('injects registry event_description and snake_case envelope', () => {
    const service = new PostHogService(client);
    service.capture({
      event: POSTHOG_EVENT.USER_LOG_IN,
      userId: 'user-1',
      properties: { surface: POSTHOG_SURFACE.AUTH },
    });
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_LOG_IN,
      distinctId: createDailyDistinctId('user-1'),
      properties: {
        surface: 'auth',
        event_description: POSTHOG_EVENT_REGISTRY.user_log_in.description,
      },
    });
  });

  it('overwrites a caller-supplied event_description from the registry', () => {
    const service = new PostHogService(client);
    service.capture({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.AUTH,
        event_description: 'invented',
      },
    });
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      distinctId: createDailyDistinctId('user-1'),
      properties: {
        surface: 'auth',
        event_description: POSTHOG_EVENT_REGISTRY.user_sign_up.description,
      },
    });
  });

  it('sets the organization group from organization_id', () => {
    const service = new PostHogService(client);
    service.capture({
      event: POSTHOG_EVENT.ORGANIZATION_JOIN,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'organization_create',
      },
    });
    const payload = capture.mock.calls[0][0] as {
      properties: Record<string, unknown>;
      groups?: Record<string, string>;
    };
    expect(payload.groups).toEqual({ organization: 'org-1' });
    for (const key of Object.keys(payload.properties)) {
      expect(key).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      expect(FORBIDDEN_POSTHOG_PROPERTY_KEYS).not.toContain(key);
    }
  });

  it('does not throw or call the client when no client is configured', () => {
    const service = new PostHogService(null);
    expect(() =>
      service.capture({
        event: POSTHOG_EVENT.USER_LOG_IN,
        userId: 'user-1',
        properties: { surface: POSTHOG_SURFACE.AUTH },
      }),
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
      service.capture({
        event: POSTHOG_EVENT.USER_LOG_IN,
        userId: 'user-1',
        properties: { surface: POSTHOG_SURFACE.AUTH },
      }),
    ).not.toThrow();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('shuts down the client on application shutdown', async () => {
    const service = new PostHogService(client);
    await service.onApplicationShutdown();
    expect(shutdown).toHaveBeenCalled();
  });

  it('strips forbidden PII keys before sending to the client', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const service = new PostHogService(client);
    service.capture({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.AUTH,
        email: 'volunteer@example.com',
        name: 'Volunteer',
      },
    });
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      distinctId: createDailyDistinctId('user-1'),
      properties: {
        surface: 'auth',
        event_description: POSTHOG_EVENT_REGISTRY.user_sign_up.description,
      },
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not throw or call the client, when no POSTHOG_DISTINCT_SECRET is set', () => {
    delete process.env.POSTHOG_DISTINCT_SECRET;

    const service = new PostHogService(client);
    service.capture({
      event: POSTHOG_EVENT.USER_LOG_IN,
      userId: 'user-1',
      properties: { surface: POSTHOG_SURFACE.AUTH },
    });
    expect(capture).not.toHaveBeenCalled();
  });
});
