import { Injectable, Logger } from '@nestjs/common';
import type { Locale } from '../graphql/locale';
import { UserLocaleService } from '../i18n/user-locale.service';
import { UserService } from '../user/user.service';
import { maskEmail } from '../utils';
import { EmailService } from './email/email.service';
import type { NotificationEventPayloadMap } from './notification-event-map';
import { NotificationEvent } from './notification-events';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

export interface UserNotificationData {
  userId: string;
  name: string;
  email: string;
  firstName: string;
  locale: Locale;
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

type MembershipLeftInput =
  NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_LEFT];

type MembershipRemovedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_REMOVED];

type MembershipRejectedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_REJECTED];

type ShiftInstanceJoinedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_JOINED];

type ShiftInstanceInvitedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_INVITED];

type ShiftInstanceCancelledInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_CANCELLED];

type ShiftInstanceSeriesCancelledInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED];

type ShiftInstanceRemovedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_REMOVED];

type ShiftSeriesRemovedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_SERIES_REMOVED];

type ShiftInstanceLeftInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_LEFT];

type ShiftSeriesLeftInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_SERIES_LEFT];

type ShiftInvitedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INVITED];

type EventInvitedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.EVENT_INVITED];

type EventJoinedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.EVENT_JOINED];

type EventCancelledInput =
  NotificationEventPayloadMap[typeof NotificationEvent.EVENT_CANCELLED];

type EventRemovedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.EVENT_REMOVED];

type DocumentAwaitingSignatureInput =
  NotificationEventPayloadMap[typeof NotificationEvent.DOCUMENT_AWAITING_SIGNATURE];

type DocumentDeclinedByOrgInput =
  NotificationEventPayloadMap[typeof NotificationEvent.DOCUMENT_DECLINED_BY_ORG];

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emitter: TypedNotificationEmitter,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly userLocaleService: UserLocaleService,
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

    const locale = await this.userLocaleService.resolveForUser(userId);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      firstName: user.name.split(' ')[0],
      locale,
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
            `Failed to send email for ${maskEmail(recipient.email)}: ${error instanceof Error ? error.message : String(error)}`,
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

  notifyMembershipLeft(input: MembershipLeftInput): void {
    this.emitter.emit(NotificationEvent.MEMBERSHIP_LEFT, input);
  }

  notifyMembershipRemoved(input: MembershipRemovedInput): void {
    this.emitter.emit(NotificationEvent.MEMBERSHIP_REMOVED, input);
  }

  notifyMembershipRejected(input: MembershipRejectedInput): void {
    this.emitter.emit(NotificationEvent.MEMBERSHIP_REJECTED, input);
  }

  notifyShiftInstanceJoined(input: ShiftInstanceJoinedInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_JOINED, input);
  }

  notifyShiftInstanceInvited(input: ShiftInstanceInvitedInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_INVITED, input);
  }

  notifyShiftInstanceCancelled(input: ShiftInstanceCancelledInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_CANCELLED, input);
  }

  notifyShiftInstanceSeriesCancelled(
    input: ShiftInstanceSeriesCancelledInput,
  ): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED, input);
  }

  notifyShiftInstanceRemoved(input: ShiftInstanceRemovedInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_REMOVED, input);
  }

  notifyShiftSeriesRemoved(input: ShiftSeriesRemovedInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_SERIES_REMOVED, input);
  }

  notifyShiftInstanceLeft(input: ShiftInstanceLeftInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INSTANCE_LEFT, input);
  }

  notifyShiftSeriesLeft(input: ShiftSeriesLeftInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_SERIES_LEFT, input);
  }

  notifyShiftInvited(input: ShiftInvitedInput): void {
    this.emitter.emit(NotificationEvent.SHIFT_INVITED, input);
  }

  notifyEventInvited(input: EventInvitedInput): void {
    this.emitter.emit(NotificationEvent.EVENT_INVITED, input);
  }

  notifyEventJoined(input: EventJoinedInput): void {
    this.emitter.emit(NotificationEvent.EVENT_JOINED, input);
  }

  notifyEventCancelled(input: EventCancelledInput): void {
    this.emitter.emit(NotificationEvent.EVENT_CANCELLED, input);
  }

  notifyEventRemoved(input: EventRemovedInput): void {
    this.emitter.emit(NotificationEvent.EVENT_REMOVED, input);
  }

  notifyDocumentAwaitingSignature(input: DocumentAwaitingSignatureInput): void {
    this.emitter.emit(NotificationEvent.DOCUMENT_AWAITING_SIGNATURE, input);
  }

  notifyDocumentDeclinedByOrg(input: DocumentDeclinedByOrgInput): void {
    this.emitter.emit(NotificationEvent.DOCUMENT_DECLINED_BY_ORG, input);
  }
}
