import type { OnApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

export const POSTHOG_CLIENT = Symbol('POSTHOG_CLIENT');

export type PostHogCaptureClient = {
  capture: (event: {
    event: string;
    distinctId: string;
    properties?: Record<string, unknown>;
    groups?: Record<string, string | number>;
  }) => void;
  shutdown: (shutdownTimeoutMs?: number) => Promise<void>;
};

export type PostHogCaptureInput = {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
  groups?: Record<string, string | number>;
};

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
  ) {}

  capture(input: PostHogCaptureInput): void {
    if (this.client) {
      try {
        this.client.capture({
          event: input.event,
          distinctId: input.distinctId,
          properties: input.properties,
          groups: input.groups,
        });
      } catch (error) {
        this.logger.error(
          'PostHog capture failed',
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}
