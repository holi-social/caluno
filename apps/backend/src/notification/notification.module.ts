import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { MembershipListener } from './listeners/membership.listener';
import { OrganizationListener } from './listeners/organization.listener';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

@Module({
  imports: [ConfigModule],
  providers: [
    TypedNotificationEmitter,
    EmailService,
    OrganizationListener,
    MembershipListener,
  ],
  exports: [TypedNotificationEmitter],
})
export class NotificationModule {}
