import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { PostHog } from 'posthog-node';
import { PostHogInterceptor } from 'posthog-node/nestjs';
import type { Observable } from 'rxjs';

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

export function createPostHogClient(
  env: NodeJS.Dict<string> = process.env,
): PostHog | null {
  const apiKey = env.POSTHOG_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new PostHog(apiKey, {
    host: env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST,
  });
}

/** No-op when PostHog is unconfigured so APP_INTERCEPTOR always has a handler. */
export class NoOpPostHogInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle();
  }
}

export function createPostHogRequestInterceptor(
  client: PostHog | null,
): NestInterceptor {
  if (!client) {
    return new NoOpPostHogInterceptor();
  }
  return new PostHogInterceptor(client);
}
