import { Logger } from '@nestjs/common';
import { POSTHOG_EVENT } from './posthog.events';
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

  it('delegates capture to the client with event, distinctId, properties, and groups', () => {
    const service = new PostHogService(client);
    service.capture({
      event: POSTHOG_EVENT.USER_LOGGED_IN,
      userId: 'user-1',
      properties: { shiftInstanceId: 'si-1' },
      groups: { organization: 'org-1' },
    });
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_LOGGED_IN,
      distinctId: createDailyDistinctId('user-1'),
      properties: { shiftInstanceId: 'si-1' },
      groups: { organization: 'org-1' },
    });
  });

  it('does not throw or call the client when no client is configured', () => {
    const service = new PostHogService(null);
    expect(() =>
      service.capture({
        event: POSTHOG_EVENT.USER_LOGGED_IN,
        userId: 'user-1',
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
        event: POSTHOG_EVENT.USER_LOGGED_IN,
        userId: 'user-1',
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

  it('captures user_logged_in with the user id as distinctId', () => {
    const service = new PostHogService(client);
    service.captureUserLoggedIn('user-1');
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_LOGGED_IN,
      distinctId: createDailyDistinctId('user-1'),
    });
  });

  it('captures user_signed_up with the user id as distinctId', () => {
    const service = new PostHogService(client);
    service.captureUserSignedUp('user-1');
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_SIGNED_UP,
      distinctId: createDailyDistinctId('user-1'),
    });
  });

  it('captures user_joined_org with org properties and group', () => {
    const service = new PostHogService(client);
    service.captureUserJoinedOrg('user-1', {
      organizationId: 'org-1',
      organizationUnitId: 'ou-1',
      source: 'membership_approved',
    });
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_JOINED_ORG,
      distinctId: createDailyDistinctId('user-1'),
      properties: {
        organizationId: 'org-1',
        organizationUnitId: 'ou-1',
        source: 'membership_approved',
      },
      groups: { organization: 'org-1' },
    });
  });

  it('does not throw or call the client, when no POSTHOG_DISTINCT_SECRET is set', () => {
    delete process.env.POSTHOG_DISTINCT_SECRET;

    const service = new PostHogService(client);
    service.captureUserLoggedIn('user-1');
    expect(capture).not.toHaveBeenCalled();
  });
});
