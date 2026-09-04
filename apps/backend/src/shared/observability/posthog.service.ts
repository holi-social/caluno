import { createHmac } from 'node:crypto';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { numericCalendarDate } from '../../i18n/format-date-time';
import {
  omitForbiddenPostHogProperties,
  POSTHOG_EVENT_REGISTRY,
  type PostHogCaptureProperties,
  type PostHogEventName,
} from './posthog.events';
import { PostHogDistinctSecretService } from './posthog-distinct-secret.service';

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

export type PostHogCaptureInput = {
  event: PostHogEventName;
  userId: string;
  properties: PostHogCaptureProperties;
};

/**
 * Daily PostHog distinctId: HMAC-SHA256 of `${userId}:YYYY-MM-DD` in
 * Europe/Berlin, keyed by the in-memory daily secret.
 */
export function createDailyDistinctId(
  userId: string,
  secret: string,
  date: Date = new Date(),
): string {
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
    private readonly distinctSecrets: PostHogDistinctSecretService,
  ) {
    if (!this.client) {
      this.logger.warn(
        'PostHog capture disabled: missing POSTHOG_API_KEY or client could not be created for another reason',
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }

  capture(input: PostHogCaptureInput): void {
    void this.captureAsync(input);
  }

  private async captureAsync(input: PostHogCaptureInput): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      const secret = await this.distinctSecrets.ensureCurrent();
      if (!secret) {
        return;
      }
      const definition = POSTHOG_EVENT_REGISTRY[input.event];
      const { properties, droppedKeys } = omitForbiddenPostHogProperties({
        ...input.properties,
        event_description: definition.description,
      });
      if (droppedKeys.length > 0) {
        this.logger.warn(
          `Dropped forbidden PostHog properties: ${droppedKeys.join(', ')}`,
        );
      }
      const groups = properties.organization_id
        ? { organization: properties.organization_id }
        : undefined;
      this.client.capture({
        event: input.event,
        distinctId: createDailyDistinctId(input.userId, secret),
        properties,
        ...(groups ? { groups } : {}),
      });
    } catch (error) {
      this.logger.error(
        'PostHog capture failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
