import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { EmailService } from './email/email.service';
import type { NotificationEventPayloadMap } from './notification-event-map';
import { NotificationEvent } from './notification-events';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

export interface UserNotificationData {
  userId: string;
  name: string;
  email: string;
  firstName: string;
}

export interface ResolveUserNotificationDataOptions {
  event: NotificationEvent;
}

type OrganizationCreatedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.ORGANIZATION_CREATED];

type MembershipRequestedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_REQUESTED];

type MembershipApprovedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_APPROVED];

type ShiftInstanceJoinedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_JOINED];

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emitter: TypedNotificationEmitter,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async resolveUserNotificationData(
    userId: string,
    options: ResolveUserNotificationDataOptions,
  ): Promise<UserNotificationData | undefined> {
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn(`Skipping ${options.event}: user ${userId} not found`);

      return undefined;
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      firstName: user.name.split(' ')[0],
    };
  }

  async resolveUsersNotificationData(
    userIds: string[],
    options: ResolveUserNotificationDataOptions,
  ): Promise<UserNotificationData[]> {
    const users = await Promise.all(
      userIds.map((userId) =>
        this.resolveUserNotificationData(userId, options),
      ),
    );

    return users.filter((user): user is UserNotificationData => Boolean(user));
  }

  async sendNotification(
    userIds: string | string[],
    options: ResolveUserNotificationDataOptions,
    callback: (
      recipient: UserNotificationData,
    ) => Promise<{ subject: string; html: string }>,
  ): Promise<void> {
    const recipients = await this.resolveUsersNotificationData(
      Array.isArray(userIds) ? userIds : [userIds],
      options,
    );
    if (recipients.length === 0) {
      this.logger.warn(`Can not resolve users for userIds: ${userIds}`);
      return;
    }

    await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const { subject, html } = await callback(recipient);
          await this.emailService.send({
            to: recipient.email,
            subject,
            html,
          });
        } catch (error) {
          this.logger.error(
            `Failed to send email for ${recipient.email}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }),
    );
  }

  notifyOrganizationCreated(input: OrganizationCreatedInput): void {
    this.emitter.emit(NotificationEvent.ORGANIZATION_CREATED, input);
  }

  notifyMembershipRequested(input: MembershipRequestedInput): void {
    this.emitter.emit(NotificationEvent.MEMBERSHIP_REQUESTED, input);
  }

  notifyMembershipApproved(input: MembershipApprovedInput): void {
    this.emitter.emit(NotificationEvent.MEMBERSHIP_APPROVED, input);
  }

  notifyShiftInstanceJoined(input: ShiftInstanceJoinedInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_JOINED, input);
  }
}
