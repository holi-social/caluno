import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityService } from './observability.service';
import { PostHogCaptureService } from './posthog.capture.service';
import {
  createPostHogClient,
  createPostHogRequestInterceptor,
} from './posthog.client';
import { POSTHOG_CLIENT, PostHogService } from './posthog.service';
import { SentryExceptionFilter } from './sentry-exception.filter';

@Global()
@Module({
  providers: [
    ObservabilityService,
    {
      provide: POSTHOG_CLIENT,
      useFactory: () => createPostHogClient(),
    },
    PostHogService,
    PostHogCaptureService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: createPostHogRequestInterceptor,
      inject: [POSTHOG_CLIENT],
    },
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
  ],
  exports: [ObservabilityService, PostHogService, PostHogCaptureService],
})
export class ObservabilityModule {}
