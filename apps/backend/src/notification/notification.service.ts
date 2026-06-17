import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import type { NotificationEventPayloadMap } from './notification-event-map';
import { NotificationEvent } from './notification-events';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

export interface UserNotificationData {
  email: string;
  firstName: string;
}

type OrganizationCreatedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.ORGANIZATION_CREATED];

type MembershipApprovedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_APPROVED];

@Injectable()
export class NotificationService {
  constructor(
    private readonly emitter: TypedNotificationEmitter,
    private readonly userService: UserService,
  ) {}

  async resolveUserNotificationData(
    userId: string,
  ): Promise<UserNotificationData | undefined> {
    const user = await this.userService.findById(userId);
    if (!user) {
      return undefined;
    }

    return {
      email: user.email,
      firstName: user.name.split(' ')[0],
    };
  }

  notifyOrganizationCreated(input: OrganizationCreatedInput): void {
    this.emitter.emit(NotificationEvent.ORGANIZATION_CREATED, input);
  }

  notifyMembershipApproved(input: MembershipApprovedInput): void {
    this.emitter.emit(NotificationEvent.MEMBERSHIP_APPROVED, input);
  }
}
