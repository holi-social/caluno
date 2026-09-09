import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ShiftUnderstaffedNotificationService } from './shift-understaffed-notification.service';

/**
 * Thin scheduler trigger, kept separate from ShiftUnderstaffedNotificationService
 * so the actual state-machine logic is unit-testable without touching Nest's
 * scheduler. One hourly tick, Europe/Berlin — no event-driven dropout hook,
 * see the understaffed-shift email package design.
 */
@Injectable()
export class ShiftUnderstaffedSchedulerService {
  private readonly logger = new Logger(ShiftUnderstaffedSchedulerService.name);

  constructor(
    private readonly notificationService: ShiftUnderstaffedNotificationService,
  ) {}

  @Cron('0 * * * *', { timeZone: 'Europe/Berlin' })
  async handleTick(): Promise<void> {
    try {
      await this.notificationService.runTick();
    } catch (error) {
      this.logger.error(
        `Understaffed-shift scheduler tick failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
