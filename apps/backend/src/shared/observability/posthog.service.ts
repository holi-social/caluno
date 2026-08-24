import { createHmac } from 'node:crypto';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { numericCalendarDate } from '../../i18n/format-date-time';
import {
  POSTHOG_EVENT,
  type PostHogEventName,
  type UserJoinedOrgCaptureInput,
} from './posthog.events';

export const POSTHOG_CLIENT = Symbol('POSTHOG_CLIENT');

type PostHogCaptureClient = {
  capture: (event: {
    event: string;
    distinctId: string;
    properties?: Record<string, unknown>;
    groups?: Record<string, string | number>;
  }) => void;
  shutdown: (shutdownTimeoutMs?: number) => Promise<void>;
};

type PostHogCaptureInput = {
  event: PostHogEventName;
  userId: string;
  properties?: Record<string, unknown>;
  groups?: Record<string, string | number>;
};

/**
 * Daily PostHog distinctId: HMAC-SHA256 of `${userId}:YYYY-MM-DD` in
 * Europe/Berlin, keyed by POSTHOG_DISTINCT_SECRET.
 */
export function createDailyDistinctId(
  userId: string,
  date: Date = new Date(),
): string {
  const secret = process.env.POSTHOG_DISTINCT_SECRET;
  if (!secret) {
    throw new Error('POSTHOG_DISTINCT_SECRET is not set');
  }
  return createHmac('sha256', secret)
    .update(`${userId}:${numericCalendarDate(date)}`)
    .digest('hex');
}

/**
 * Thin DI wrapper around posthog-node so domain services stay testable.
 * Import this service — never `posthog-node` — in domain code.
 */
@Injectable()
export class PostHogService implements OnApplicationShutdown {
  private readonly logger = new Logger(PostHogService.name);

  constructor(
    @Optional()
    @Inject(POSTHOG_CLIENT)
    private readonly client: PostHogCaptureClient | null,
  ) {
    if (!this.client || !process.env.POSTHOG_DISTINCT_SECRET) {
      this.logger.warn(
        'PostHog capture disabled: missing POSTHOG_API_KEY or POSTHOG_DISTINCT_SECRET or client could not be created for another reason',
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }

  capture(input: PostHogCaptureInput): void {
    if (this.client && process.env.POSTHOG_DISTINCT_SECRET) {
      try {
        this.client.capture({
          event: input.event,
          distinctId: createDailyDistinctId(input.userId),
          ...(input.properties ? { properties: input.properties } : {}),
          ...(input.groups ? { groups: input.groups } : {}),
        });
      } catch (error) {
        this.logger.error(
          'PostHog capture failed',
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  captureUserSignedUp(userId: string): void {
    this.capture({
      event: POSTHOG_EVENT.USER_SIGNED_UP,
      userId,
    });
  }

  captureUserLoggedIn(userId: string): void {
    this.capture({
      event: POSTHOG_EVENT.USER_LOGGED_IN,
      userId,
    });
  }

  captureUserJoinedOrg(userId: string, input: UserJoinedOrgCaptureInput): void {
    this.capture({
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
