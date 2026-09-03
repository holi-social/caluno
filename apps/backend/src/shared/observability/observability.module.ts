import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ObservabilityService } from './observability.service';
import { buildPinoHttpOptions } from './pino-options';
import {
  createPostHogClient,
  createPostHogRequestInterceptor,
} from './posthog.client';
import { POSTHOG_CLIENT, PostHogService } from './posthog.service';
import { SentryExceptionFilter } from './sentry-exception.filter';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: buildPinoHttpOptions({
          nodeEnv: process.env.NODE_ENV,
          logLevel: process.env.LOG_LEVEL,
        }),
      }),
    }),
  ],
  providers: [
    ObservabilityService,
    {
      provide: POSTHOG_CLIENT,
      useFactory: () => createPostHogClient(),
    },
    PostHogService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: createPostHogRequestInterceptor,
      inject: [POSTHOG_CLIENT],
    },
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
  ],
  exports: [ObservabilityService, PostHogService, LoggerModule],
})
export class ObservabilityModule {}
