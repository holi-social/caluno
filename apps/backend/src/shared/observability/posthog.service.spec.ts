import { Logger } from '@nestjs/common';
import {
  FORBIDDEN_POSTHOG_PROPERTY_KEYS,
  POSTHOG_EVENT,
  POSTHOG_EVENT_REGISTRY,
  POSTHOG_SURFACE,
} from './posthog.events';
import { createDailyDistinctId, PostHogService } from './posthog.service';
import type { PostHogDistinctSecretService } from './posthog-distinct-secret.service';
import type {
  PostHogOrgLabelService,
  PostHogOrgLabels,
} from './posthog-org-label.service';

async function flushCapture(): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve();
  }
}

function secrets(
  secret: string | null,
): Pick<PostHogDistinctSecretService, 'ensureCurrent'> {
  return { ensureCurrent: jest.fn().mockResolvedValue(secret) };
}

function orgLabels(
  result: PostHogOrgLabels = {},
): Pick<PostHogOrgLabelService, 'resolve'> {
  return { resolve: jest.fn().mockResolvedValue(result) };
}

describe('PostHogService', () => {
  const capture = jest.fn();
  const shutdown = jest.fn().mockResolvedValue(undefined);
  const client = { capture, shutdown };
  const distinctSecrets = secrets('test-secret');
  const labels = orgLabels();

  beforeEach(() => {
    capture.mockReset();
    shutdown.mockReset().mockResolvedValue(undefined);
    (distinctSecrets.ensureCurrent as jest.Mock).mockResolvedValue(
      'test-secret',
    );
    (labels.resolve as jest.Mock).mockResolvedValue({});
  });

  function service(
    captureClient: typeof client | null = client,
    secretService: Pick<
      PostHogDistinctSecretService,
      'ensureCurrent'
    > = distinctSecrets,
    labelService: Pick<PostHogOrgLabelService, 'resolve'> = labels,
  ): PostHogService {
    return new PostHogService(
      captureClient,
      secretService as never,
      labelService as never,
    );
  }

  it('injects registry event_description and snake_case envelope', async () => {
    service().capture({
      event: POSTHOG_EVENT.USER_LOG_IN,
      userId: 'user-1',
      properties: { surface: POSTHOG_SURFACE.AUTH },
    });
    await flushCapture();
    expect(labels.resolve).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_LOG_IN,
      distinctId: createDailyDistinctId('user-1', 'test-secret'),
      properties: {
        surface: 'auth',
        event_description: POSTHOG_EVENT_REGISTRY.user_log_in.description,
      },
    });
  });

  it('overwrites a caller-supplied event_description from the registry', async () => {
    service().capture({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.AUTH,
        event_description: 'invented',
      },
    });
    await flushCapture();
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      distinctId: createDailyDistinctId('user-1', 'test-secret'),
      properties: {
        surface: 'auth',
        event_description: POSTHOG_EVENT_REGISTRY.user_sign_up.description,
      },
    });
  });

  it('sets the organization group and tenant names from ids', async () => {
    (labels.resolve as jest.Mock).mockResolvedValue({
      organization_id: 'org-1',
      organization_name: 'Acme Volunteers',
      organization_unit_id: 'ou-1',
      organization_unit_name: 'Berlin',
    });
    service().capture({
      event: POSTHOG_EVENT.ORGANIZATION_JOIN,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'organization_create',
      },
    });
    await flushCapture();
    expect(labels.resolve).toHaveBeenCalledWith({
      organizationId: 'org-1',
      organizationUnitId: 'ou-1',
    });
    const payload = capture.mock.calls[0][0] as {
      properties: Record<string, unknown>;
      groups?: Record<string, string>;
    };
    expect(payload.groups).toEqual({ organization: 'org-1' });
    expect(payload.properties).toMatchObject({
      organization_id: 'org-1',
      organization_name: 'Acme Volunteers',
      organization_unit_id: 'ou-1',
      organization_unit_name: 'Berlin',
    });
    for (const key of Object.keys(payload.properties)) {
      expect(key).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      expect(FORBIDDEN_POSTHOG_PROPERTY_KEYS).not.toContain(key);
    }
  });

  it('still captures when organization labels cannot be resolved', async () => {
    (labels.resolve as jest.Mock).mockRejectedValue(new Error('db down'));
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    service().capture({
      event: POSTHOG_EVENT.ORGANIZATION_JOIN,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
      },
    });
    await flushCapture();
    expect(capture).toHaveBeenCalled();
    expect(capture.mock.calls[0][0].properties.organization_id).toBe('org-1');
    expect(
      capture.mock.calls[0][0].properties.organization_name,
    ).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not throw or call the client when no client is configured', async () => {
    expect(() =>
      service(null).capture({
        event: POSTHOG_EVENT.USER_LOG_IN,
        userId: 'user-1',
        properties: { surface: POSTHOG_SURFACE.AUTH },
      }),
    ).not.toThrow();
    await flushCapture();
    expect(capture).not.toHaveBeenCalled();
  });

  it('does not throw when the client capture fails', async () => {
    capture.mockImplementation(() => {
      throw new Error('network down');
    });
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    expect(() =>
      service().capture({
        event: POSTHOG_EVENT.USER_LOG_IN,
        userId: 'user-1',
        properties: { surface: POSTHOG_SURFACE.AUTH },
      }),
    ).not.toThrow();
    await flushCapture();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('shuts down the client on application shutdown', async () => {
    await service().onApplicationShutdown();
    expect(shutdown).toHaveBeenCalled();
  });

  it('strips forbidden PII keys before sending to the client', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    service().capture({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      userId: 'user-1',
      properties: {
        surface: POSTHOG_SURFACE.AUTH,
        email: 'volunteer@example.com',
        name: 'Volunteer',
      },
    });
    await flushCapture();
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_SIGN_UP,
      distinctId: createDailyDistinctId('user-1', 'test-secret'),
      properties: {
        surface: 'auth',
        event_description: POSTHOG_EVENT_REGISTRY.user_sign_up.description,
      },
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not throw or call the client when the secret is not loaded', async () => {
    process.env.POSTHOG_DISTINCT_SECRET = 'must-not-be-used';
    const unloaded = secrets(null);
    expect(() =>
      service(client, unloaded).capture({
        event: POSTHOG_EVENT.USER_LOG_IN,
        userId: 'user-1',
        properties: { surface: POSTHOG_SURFACE.AUTH },
      }),
    ).not.toThrow();
    await flushCapture();
    expect(capture).not.toHaveBeenCalled();
    delete process.env.POSTHOG_DISTINCT_SECRET;
  });
});
