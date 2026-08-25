import { PostHogCaptureService } from './posthog.capture.service';
import { POSTHOG_EVENT } from './posthog.events';
import { createDailyDistinctId, PostHogService } from './posthog.service';

describe('PostHogCaptureService', () => {
  const capture = jest.fn();
  const shutdown = jest.fn().mockResolvedValue(undefined);
  const client = { capture, shutdown };

  beforeEach(() => {
    capture.mockReset();
    process.env.POSTHOG_DISTINCT_SECRET = 'test-secret';
    shutdown.mockReset().mockResolvedValue(undefined);
  });

  function createService(): PostHogCaptureService {
    return new PostHogCaptureService(new PostHogService(client));
  }

  it('captures user_logged_in with the user id as distinctId', () => {
    createService().captureUserLoggedIn('user-1');
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_LOGGED_IN,
      distinctId: createDailyDistinctId('user-1'),
    });
  });

  it('captures user_signed_up with the user id as distinctId', () => {
    createService().captureUserSignedUp('user-1');
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.USER_SIGNED_UP,
      distinctId: createDailyDistinctId('user-1'),
    });
  });

  it('captures user_joined_org with org properties and group', () => {
    createService().captureUserJoinedOrg('user-1', {
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
});
