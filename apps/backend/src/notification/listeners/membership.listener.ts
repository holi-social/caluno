import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { membershipApprovedTemplate } from '../email/templates/membership-approved.template';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class MembershipListener {
  private readonly logger = new Logger(MembershipListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(NotificationEvent.MEMBERSHIP_APPROVED)
  async handleMembershipApproved(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_APPROVED],
  ): Promise<void> {
    try {
      const { subject, html } = await membershipApprovedTemplate(payload, {
        appUrl: this.configService.get<string>('WEB_URL'),
      });
      await this.emailService.send({ to: payload.memberEmail, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to handle ${NotificationEvent.MEMBERSHIP_APPROVED}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
