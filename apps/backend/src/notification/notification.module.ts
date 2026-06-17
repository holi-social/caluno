import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { EmailService } from './email/email.service';
import { MembershipListener } from './listeners/membership.listener';
import { OrganizationListener } from './listeners/organization.listener';
import { NotificationService } from './notification.service';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [
    TypedNotificationEmitter,
    NotificationService,
    EmailService,
    OrganizationListener,
    MembershipListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
