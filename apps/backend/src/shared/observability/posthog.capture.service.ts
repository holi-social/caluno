import { Injectable } from '@nestjs/common';
import {
  POSTHOG_EVENT,
  type UserJoinedOrgCaptureInput,
} from './posthog.events';
import { PostHogService } from './posthog.service';

/**
 * Named product-event helpers. Domain code injects this — not PostHogService —
 * so event names and property shapes stay in one place.
 */
@Injectable()
export class PostHogCaptureService {
  constructor(private readonly postHogService: PostHogService) {}

  captureUserSignedUp(userId: string): void {
    this.postHogService.capture({
      event: POSTHOG_EVENT.USER_SIGNED_UP,
      userId,
    });
  }

  captureUserLoggedIn(userId: string): void {
    this.postHogService.capture({
      event: POSTHOG_EVENT.USER_LOGGED_IN,
      userId,
    });
  }

  captureUserJoinedOrg(userId: string, input: UserJoinedOrgCaptureInput): void {
    this.postHogService.capture({
      event: POSTHOG_EVENT.USER_JOINED_ORG,
      userId,
      properties: {
        organizationId: input.organizationId,
        organizationUnitId: input.organizationUnitId,
        source: input.source,
      },
      groups: { organization: input.organizationId },
    });
  }
}
