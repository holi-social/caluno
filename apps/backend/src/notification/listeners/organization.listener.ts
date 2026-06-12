import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { organizationCreatedTemplate } from '../email/templates/organization-created.template';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class OrganizationListener {
  private readonly logger = new Logger(OrganizationListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(NotificationEvent.ORGANIZATION_CREATED)
  async handleOrganizationCreated(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.ORGANIZATION_CREATED],
  ): Promise<void> {
    try {
      const { subject, html } = await organizationCreatedTemplate(payload, {
        appUrl: this.configService.get<string>('WEB_URL'),
      });
      await this.emailService.send({ to: payload.ownerEmail, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to handle ${NotificationEvent.ORGANIZATION_CREATED}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
