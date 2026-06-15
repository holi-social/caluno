import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { OrganizationListener } from './listeners/organization.listener';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

@Module({
  imports: [ConfigModule],
  providers: [TypedNotificationEmitter, EmailService, OrganizationListener],
  exports: [TypedNotificationEmitter],
})
export class NotificationModule {}
