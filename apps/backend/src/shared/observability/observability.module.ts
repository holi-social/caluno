import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ObservabilityService } from './observability.service';
import { SentryExceptionFilter } from './sentry-exception.filter';

@Global()
@Module({
  providers: [
    ObservabilityService,
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
